import logging
import json
import asyncio
import time
from collections import OrderedDict
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from pydantic import ValidationError
from app.schemas.ai_translation import AITranslationResult
from app.core.config import settings
from app.core.exceptions import AppException
from app.services.base_translation import BaseAITranslationService

logger = logging.getLogger(__name__)

_CIRCUIT_BREAKER_THRESHOLD = 5
_CIRCUIT_BREAKER_COOLDOWN_SECONDS = 60
_CACHE_MAX_SIZE = 256
_LOG_RESPONSE_PREVIEW_LENGTH = 120

_PROMPT_TEMPLATE = PromptTemplate(
    input_variables=["input_text", "known_words"],
    template=(
        "You are an ASL grammar translation engine. Your only job is to output valid JSON.\n\n"
        "Convert the input sentence into ASL grammar form.\n\n"
        "KNOWN GESTURE VOCABULARY (prefer these words in your output tokens when semantically correct):\n"
        "{known_words}\n\n"
        "Rules:\n"
        "- Return ONLY a JSON object. No markdown, no explanation, no extra text.\n"
        "- Remove articles (a, an, the), auxiliary verbs (is, am, are, was, were, be), and prepositions (of, in, on, at, by).\n"
        "- Reorder words to ASL topic-comment structure (time expressions first, then subject, then predicate).\n"
        "- All tokens must be uppercase English words.\n"
        "- IMPORTANT: Do NOT alter or correct proper nouns (names of people, places, brands). Keep them exactly as given, uppercased.\n"
        "- Prefer using words from the KNOWN GESTURE VOCABULARY when they are semantically equivalent.\n"
        "- tokens list must contain every word present in asl_text, split by spaces.\n"
        "- emotion must be exactly one of: HAPPY, SAD, NEUTRAL.\n\n"
        "Input:\n{input_text}\n\n"
        'Output:\n{{"asl_text": "UPPERCASE ASL SENTENCE", "tokens": ["UPPERCASE", "ASL", "SENTENCE"], "emotion": "NEUTRAL"}}'
    ),
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


class AITranslationService(BaseAITranslationService):
    _instance: "AITranslationService | None" = None

    def __new__(cls) -> "AITranslationService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._consecutive_failures = 0
        self._circuit_opened_at: float | None = None
        self._cache = _LRUCache(_CACHE_MAX_SIZE)
        self._ai_success_count = 0
        self._ai_failure_count = 0
        self._known_words_str: str = ""

        try:
            self.llm = ChatGroq(
                api_key=settings.groq_api_key,
                model_name=settings.llm_model,
                temperature=0.0,
                timeout=7.0,
                max_retries=0,
            )
            self._chain = _PROMPT_TEMPLATE | self.llm
        except Exception:
            logger.exception("AITranslationService: Failed to initialize ChatGroq.")
            self.llm = None
            self._chain = None

    def load_gesture_vocabulary(self, gesture_map: dict) -> None:
        words = sorted(gesture_map.keys())
        self._known_words_str = ", ".join(words)
        logger.info(f"AITranslationService: Loaded {len(words)} gesture vocabulary words into prompt context.")

    def _is_circuit_open(self) -> bool:
        if self._consecutive_failures < _CIRCUIT_BREAKER_THRESHOLD:
            return False
        if self._circuit_opened_at is None:
            return True
        elapsed = time.monotonic() - self._circuit_opened_at
        if elapsed >= _CIRCUIT_BREAKER_COOLDOWN_SECONDS:
            logger.info("AITranslationService: Circuit breaker cooldown elapsed. Resetting.")
            self._consecutive_failures = 0
            self._circuit_opened_at = None
            return False
        return True

    def _record_success(self) -> None:
        self._consecutive_failures = 0
        self._circuit_opened_at = None
        self._ai_success_count += 1
        logger.info(f"AITranslationService: Cumulative success={self._ai_success_count} failure={self._ai_failure_count}.")

    def _record_failure(self) -> None:
        self._consecutive_failures += 1
        self._ai_failure_count += 1
        if self._consecutive_failures >= _CIRCUIT_BREAKER_THRESHOLD:
            if self._circuit_opened_at is None:
                self._circuit_opened_at = time.monotonic()
                logger.warning(
                    f"AITranslationService: Circuit breaker opened. "
                    f"consecutive={self._consecutive_failures} total_failures={self._ai_failure_count}."
                )

    def _extract_json(self, raw_content: str) -> dict:
        decoder = json.JSONDecoder()
        for i, char in enumerate(raw_content):
            if char == "{":
                try:
                    obj, _ = decoder.raw_decode(raw_content, i)
                    if not isinstance(obj, dict):
                        continue
                    missing = {"asl_text", "tokens", "emotion"} - obj.keys()
                    if missing:
                        raise ValueError(f"LLM JSON missing required keys: {missing}")
                    return obj
                except json.JSONDecodeError:
                    continue
        raise ValueError("No valid JSON object with required keys found in LLM response.")

    def _validate(self, parsed_data: dict) -> AITranslationResult:
        return super()._validate(parsed_data, "AITranslationService")

    async def _invoke_llm(self, clean_text: str) -> AITranslationResult:
        response = await self._chain.ainvoke({
            "input_text": clean_text,
            "known_words": self._known_words_str or "No vocabulary loaded",
        })
        preview = response.content[:_LOG_RESPONSE_PREVIEW_LENGTH].replace("\n", " ")
        logger.debug(f"AITranslationService: LLM response preview: {preview!r}")
        parsed_data = self._extract_json(response.content)
        return self._validate(parsed_data)

    async def translate(self, clean_text: str) -> AITranslationResult:
        if not self.llm or not self._chain:
            raise AppException("AI engine not initialized.", 503)

        if self._is_circuit_open():
            logger.warning(
                f"AITranslationService: Circuit breaker open "
                f"(consecutive={self._consecutive_failures}). Triggering fallback."
            )
            raise AppException("AI service temporarily disabled due to repeated failures.", 503)

        cached = await self._cache.get(clean_text)
        if cached is not None:
            logger.info("AITranslationService: Cache hit.")
            return cached

        last_exception: Exception | None = None

        for attempt in range(2):
            if attempt > 0:
                await asyncio.sleep(1.0)
                logger.info("AITranslationService: Retrying LLM call.")

            try:
                logger.info(f"AITranslationService: Invoking LLM. Attempt {attempt + 1}.")
                result = await self._invoke_llm(clean_text)
                self._record_success()
                await self._cache.set(clean_text, result)
                logger.info("AITranslationService: Translation successful.")
                return result

            except (ValidationError, ValueError, json.JSONDecodeError) as e:
                logger.warning(f"AITranslationService: Parsing/validation error on attempt {attempt + 1}: {e}")
                last_exception = e

            except AppException:
                raise

            except Exception as e:
                logger.warning(f"AITranslationService: LLM call error on attempt {attempt + 1}: {e}")
                last_exception = e

        self._record_failure()
        raise AppException(f"AI translation failed after retries: {last_exception}", 503)
