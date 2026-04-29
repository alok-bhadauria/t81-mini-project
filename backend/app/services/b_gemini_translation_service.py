import json
import asyncio
import logging
import os
from collections import OrderedDict

from google import genai
from google.genai import types as genai_types
from pydantic import ValidationError

from app.core.config import settings
from app.core.exceptions import AppException
from app.schemas.ai_translation import AITranslationResult
from app.services.base_translation import BaseAITranslationService

logger = logging.getLogger(__name__)

_GEMINI_TIMEOUT_SECONDS = 12.0
_CACHE_MAX_SIZE = 256
_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def _load_json(filename: str) -> dict:
    path = os.path.join(_DATA_DIR, filename)
    with open(path, "r") as f:
        return json.load(f)


def _build_prompt(clean_text: str, gesture_map: dict, sentiment_map: dict) -> str:
    gesture_vocab = ", ".join(sorted(k for k in gesture_map.keys() if len(k) > 1))
    emotion_list = ", ".join(sentiment_map.keys())
    return (
        "You are a strict ASL grammar engine. Return ONLY a single valid JSON object. No markdown. No explanation.\n\n"
        "TASK 1 — ASL GRAMMAR CONVERSION:\n"
        "Convert the input text to ASL grammar:\n"
        "- Remove: articles (a, an, the), auxiliary verbs (is, am, are, was, were, be, been, being), "
        "conjunctions (and, but, or), and prepositions (of, in, on, at, by, for, to, with).\n"
        "- Reorder: time expressions first, then topic/subject, then predicate/action.\n"
        "- All output tokens must be UPPERCASE English words.\n"
        "- Proper nouns (names of people, places, brands): preserve exactly as-is, uppercased. Do NOT substitute or alter them.\n"
        "- Unknown or invented words: preserve as uppercase without substitution.\n"
        f"- When semantically equivalent, prefer words from this gesture vocabulary: [{gesture_vocab}]\n\n"
        "TASK 2 — EMOTION CLASSIFICATION:\n"
        f"Classify the overall emotion of the input. Choose exactly one from: {emotion_list}.\n\n"
        "STRICT OUTPUT RULES:\n"
        "- tokens must contain exactly the same words as asl_text, split by spaces. No extras. No omissions.\n"
        "- asl_text is the space-joined version of tokens.\n"
        "- tokens must be a non-empty list of uppercase strings.\n"
        "- Return ONLY this exact JSON structure:\n"
        '{"asl_text": "WORD1 WORD2 WORD3", "tokens": ["WORD1", "WORD2", "WORD3"], "emotion": "NEUTRAL"}\n\n'
        f"INPUT:\n{clean_text}"
    )


class _LRUCache:
    def __init__(self, max_size: int):
        self._max_size = max_size
        self._store: OrderedDict[str, AITranslationResult] = OrderedDict()
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> AITranslationResult | None:
        async with self._lock:
            if key not in self._store:
                return None
            self._store.move_to_end(key)
            return self._store[key]

    async def set(self, key: str, value: AITranslationResult) -> None:
        async with self._lock:
            if key in self._store:
                self._store.move_to_end(key)
            else:
                if len(self._store) >= self._max_size:
                    self._store.popitem(last=False)
            self._store[key] = value


class GeminiTranslationService(BaseAITranslationService):
    _instance: "GeminiTranslationService | None" = None

    def __new__(cls) -> "GeminiTranslationService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._cache = _LRUCache(_CACHE_MAX_SIZE)
        self._gesture_map: dict = {}
        self._sentiment_map: dict = {}
        self._client = None
        self._success_count = 0
        self._failure_count = 0

        if not settings.gemini_api_key:
            logger.warning("GeminiTranslationService: GEMINI_API_KEY not set. Service disabled.")
            return

        try:
            self._gesture_map = _load_json("gesture_map.json")
            self._sentiment_map = _load_json("sentiment_map.json")
            self._client = genai.Client(api_key=settings.gemini_api_key)
            logger.info(
                f"GeminiTranslationService: Initialized. model={settings.gemini_model} "
                f"gesture_vocab={len(self._gesture_map)} sentiments={len(self._sentiment_map)}."
            )
        except Exception:
            logger.exception("GeminiTranslationService: Initialization failed.")
            self._client = None

    @property
    def is_available(self) -> bool:
        return self._client is not None

    def _strip_fences(self, raw: str) -> str:
        stripped = raw.strip()
        if not stripped.startswith("```"):
            return stripped
        lines = stripped.splitlines()
        inner = [ln for ln in lines if not ln.strip().startswith("```")]
        return "\n".join(inner).strip()

    def _extract_json(self, raw: str) -> dict:
        clean = self._strip_fences(raw)
        decoder = json.JSONDecoder()
        for i, char in enumerate(clean):
            if char != "{":
                continue
            try:
                obj, _ = decoder.raw_decode(clean, i)
                if not isinstance(obj, dict):
                    continue
                missing = {"asl_text", "tokens", "emotion"} - obj.keys()
                if missing:
                    logger.warning(f"GeminiTranslationService: JSON missing keys {missing}.")
                    continue
                return obj
            except json.JSONDecodeError:
                continue
        raise ValueError(f"No valid JSON with required keys found. Raw preview: {clean[:200]!r}")

    def _validate(self, parsed: dict) -> AITranslationResult:
        return super()._validate(parsed, "GeminiTranslationService")

    def _call_gemini_sync(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.0,
                candidate_count=1,
            ),
        )
        return response.text

    async def _invoke(self, clean_text: str) -> AITranslationResult:
        prompt = _build_prompt(clean_text, self._gesture_map, self._sentiment_map)
        raw = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(None, self._call_gemini_sync, prompt),
            timeout=_GEMINI_TIMEOUT_SECONDS,
        )
        logger.debug(f"GeminiTranslationService: Raw preview: {raw[:120].replace(chr(10), ' ')!r}")
        parsed = self._extract_json(raw)
        return self._validate(parsed)

    async def translate(self, clean_text: str) -> AITranslationResult:
        if not self.is_available:
            raise AppException("Gemini service not initialized.", 503)

        cached = await self._cache.get(clean_text)
        if cached is not None:
            logger.info("GeminiTranslationService: Cache hit.")
            return cached

        last_exc: Exception | None = None

        for attempt in range(2):
            if attempt > 0:
                await asyncio.sleep(1.0)
                logger.info("GeminiTranslationService: Retrying after failure.")

            try:
                logger.info(f"GeminiTranslationService: Attempt {attempt + 1}.")
                result = await self._invoke(clean_text)
                self._success_count += 1
                logger.info(
                    f"GeminiTranslationService: Success. "
                    f"success={self._success_count} failure={self._failure_count}."
                )
                await self._cache.set(clean_text, result)
                return result

            except (ValidationError, ValueError, json.JSONDecodeError) as e:
                logger.warning(
                    f"GeminiTranslationService: Validation/parse error attempt {attempt + 1}: {e}"
                )
                last_exc = e

            except asyncio.TimeoutError:
                logger.warning(f"GeminiTranslationService: Timeout on attempt {attempt + 1}.")
                last_exc = asyncio.TimeoutError()

            except AppException:
                raise

            except Exception as e:
                logger.warning(f"GeminiTranslationService: API error attempt {attempt + 1}: {type(e).__name__}: {e}")
                last_exc = e

        self._failure_count += 1
        logger.error(
            f"GeminiTranslationService: All attempts exhausted. "
            f"success={self._success_count} failure={self._failure_count}. "
            f"Last error: {type(last_exc).__name__}: {last_exc}"
        )
        raise AppException(f"Gemini translation failed after retries: {last_exc}", 503)
