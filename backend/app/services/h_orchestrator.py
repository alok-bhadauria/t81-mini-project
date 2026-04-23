import logging
import asyncio
import time
from pydantic import ValidationError
from app.services.a_preprocess_service import PreprocessService
from app.services.b_gemini_translation_service import GeminiTranslationService
from app.services.c_ai_translation_service import AITranslationService
from app.services.d_nlp_service import NLPService
from app.services.e_translation_service import TranslationService
from app.services.f_animation_service import AnimationService
from app.services.g_output_service import OutputService
from app.db.task_repository import TaskRepository
from app.core.exceptions import AppException
from app.schemas.text import TextInputResponse
from app.core.utils import retry_async

logger = logging.getLogger(__name__)

SOURCE_GEMINI = "GEMINI"
SOURCE_AI = "AI"
SOURCE_RULE = "RULE"

GEMINI_TIMEOUT_SECONDS = 15.0
AI_TIMEOUT_SECONDS = 10.0


class PipelineOrchestrator:
    def __init__(
        self,
        repository: TaskRepository,
        preprocess: PreprocessService = None,
        gemini_translation: GeminiTranslationService = None,
        ai_translation: AITranslationService = None,
        animation_service: AnimationService = None,
        output_service: OutputService = None,
    ):
        self.repository = repository
        self.preprocess = preprocess or PreprocessService()
        self.gemini_translation = gemini_translation or GeminiTranslationService()
        self.ai_translation = ai_translation or AITranslationService()
        self.animation = animation_service or AnimationService()
        self.output_handler = output_service or OutputService()

        self._nlp_service: NLPService | None = None
        self._rule_translation: TranslationService | None = None

    def _get_nlp_service(self) -> NLPService:
        if self._nlp_service is None:
            self._nlp_service = NLPService()
        return self._nlp_service

    def _get_rule_translation(self) -> TranslationService:
        if self._rule_translation is None:
            self._rule_translation = TranslationService()
        return self._rule_translation

    async def _run_gemini_path(self, clean_text: str) -> tuple[str, str, str, list[str]]:
        result = await asyncio.wait_for(
            self.gemini_translation.translate(clean_text),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
        return (clean_text, result.emotion, result.asl_text, result.tokens)

    async def _run_ai_path(self, clean_text: str) -> tuple[str, str, str, list[str]]:
        result = await asyncio.wait_for(
            self.ai_translation.translate(clean_text),
            timeout=AI_TIMEOUT_SECONDS,
        )
        return (clean_text, result.emotion, result.asl_text, result.tokens)

    async def _run_fallback_path(self, clean_text: str) -> tuple[str, str, str, list[str]]:
        nlp_result = await self._get_nlp_service().process(clean_text)
        fallback = self._get_rule_translation().translate(nlp_result)
        return (
            nlp_result.processed_text,
            nlp_result.emotion_id,
            fallback.asl_grammar_output,
            fallback.asl_tokens,
        )

    @retry_async(max_retries=3, delay=2.0)
    async def _persist_task(
        self,
        user_id: str,
        input_type: str,
        raw_text: str,
        processed_text: str,
        emotion_id: str,
        asl_grammar_output: str,
        animation_package: dict,
        file_metadata: dict,
        source: str,
    ) -> None:
        try:
            await self.repository.create_task(
                user_id=user_id,
                input_type=input_type,
                raw_text=raw_text,
                processed_text=processed_text,
                emotion_id=emotion_id,
                asl_grammar_output=asl_grammar_output,
                sentiment_animation_id=animation_package["sentiment_animation_id"],
                gesture_animation_ids=animation_package["gesture_animation_ids"],
                animation_sequence=animation_package["animation_sequence"],
                file_metadata={**(file_metadata or {}), "translation_source": source},
            )
        except Exception:
            logger.exception(f"Orchestrator: DB write failed for user {user_id}.")

    async def run(
        self,
        raw_text: str,
        user_id: str,
        input_type: str,
        file_metadata: dict = None,
    ) -> tuple[TextInputResponse, dict]:
        start_time = time.monotonic()
        logger.info(f"Orchestrator: Pipeline start. user={user_id}.")

        clean_text = await self.preprocess.process(raw_text)
        source = SOURCE_GEMINI
        processed_text = clean_text
        emotion_id = "NEUTRAL"
        asl_grammar_output = ""
        asl_tokens: list[str] = []

        if self.gemini_translation.is_available:
            try:
                processed_text, emotion_id, asl_grammar_output, asl_tokens = await self._run_gemini_path(clean_text)
                logger.info(f"Orchestrator: Gemini path succeeded. user_id={user_id}")
            except (AppException, ValidationError, asyncio.TimeoutError, Exception) as e:
                logger.warning(
                    f"Orchestrator: Gemini path failed. user_id={user_id} "
                    f"reason={type(e).__name__}: {e}. Falling through to Groq AI."
                )
                source = SOURCE_AI
        else:
            logger.info(f"Orchestrator: Gemini unavailable. Using Groq AI path. user_id={user_id}")
            source = SOURCE_AI

        if source == SOURCE_AI:
            try:
                processed_text, emotion_id, asl_grammar_output, asl_tokens = await self._run_ai_path(clean_text)
                logger.info(f"Orchestrator: Groq AI path succeeded. user_id={user_id}")
            except (AppException, ValidationError, asyncio.TimeoutError, Exception) as e:
                logger.warning(
                    f"Orchestrator: Groq AI path failed. user_id={user_id} "
                    f"reason={type(e).__name__}: {e}. Falling through to rule-based NLP."
                )
                source = SOURCE_RULE
                try:
                    processed_text, emotion_id, asl_grammar_output, asl_tokens = await self._run_fallback_path(clean_text)
                    logger.info(f"Orchestrator: Rule-based NLP fallback succeeded. user_id={user_id}")
                except Exception as fe:
                    logger.error(f"Orchestrator: Rule-based fallback failed. user_id={user_id} reason={type(fe).__name__}: {fe}.")
                    raise AppException("All translation paths failed. Please try again.", 503)

        asl_tokens = [t.strip().upper() for t in asl_tokens if t.strip()]
        asl_grammar_output = asl_grammar_output.strip()
        
        if not asl_tokens or not asl_grammar_output:
            logger.error(f"Orchestrator: Validation failed. Empty ASL output. user_id={user_id}")
            raise AppException("Translation resulted in empty output.", 500)

        animation_package = self.animation.map(emotion_id, asl_tokens)

        duration = time.monotonic() - start_time
        logger.info(
            f"Orchestrator: Pipeline complete. user_id={user_id} source={source} emotion={emotion_id} duration={duration:.3f}s."
        )

        persist_kwargs = dict(
            user_id=user_id,
            input_type=input_type,
            raw_text=raw_text,
            processed_text=processed_text,
            emotion_id=emotion_id,
            asl_grammar_output=asl_grammar_output,
            animation_package=animation_package,
            file_metadata=file_metadata,
            source=source,
        )

        api_response = self.output_handler.format_api_response(
            processed_text=processed_text,
            asl_grammar_output=asl_grammar_output,
            sentiment_animation_id=animation_package["sentiment_animation_id"],
            gesture_animation_ids=animation_package["gesture_animation_ids"],
            animation_sequence=animation_package["animation_sequence"],
        )
        
        return api_response, persist_kwargs
