import logging
from app.schemas.text import TextInputResponse

logger = logging.getLogger(__name__)

class OutputService:
    def format_api_response(self, 
                            processed_text: str, 
                            asl_grammar_output: str, 
                            sentiment_animation_id: str, 
                            gesture_animation_ids: list[str], 
                            animation_sequence: list[dict]) -> TextInputResponse:
        logger.info("OutputService: Safely formatting standardized JSON API Response Structure.")
        return TextInputResponse(
            message="Text input received and stored successfully.",
            processed_text=processed_text,
            asl_grammar_output=asl_grammar_output,
            sentiment_animation_id=sentiment_animation_id,
            gesture_animation_ids=gesture_animation_ids,
            animation_sequence=animation_sequence
        )
