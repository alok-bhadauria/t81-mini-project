import logging
from app.schemas.ai_translation import AITranslationResult

logger = logging.getLogger(__name__)

class BaseAITranslationService:
    def _validate(self, parsed: dict, service_name: str) -> AITranslationResult:
        result = AITranslationResult(**parsed)

        asl_text = result.asl_text.strip()
        if not asl_text:
            raise ValueError(f"Validation failed in {service_name}: asl_text is empty.")

        tokens = [t.upper() for t in result.tokens if t.strip()]
        if not tokens:
            raise ValueError(f"Validation failed in {service_name}: tokens list is empty after normalization.")

        expected_words = asl_text.upper().split()

        if expected_words != tokens:
            logger.warning(
                f"{service_name}: Token mismatch. "
                f"asl_words={expected_words} tokens={tokens}. Rebuilding tokens from asl_text."
            )
            tokens = expected_words

        result.tokens = tokens
        return result
