import logging
from typing import List
from app.schemas.text import TextInputResponse, AnimationToken

logger = logging.getLogger(__name__)

_SENTIMENT_WORDS = frozenset([
    "happy", "sad", "angry", "excited", "confused", "fear", "disgust", "bored"
])


class OutputService:
    def _classify_token(self, token: str) -> str:
        if token.lower() in _SENTIMENT_WORDS:
            return "sentiment"
        return "gesture"

    def build_animation_stream(self, asl_tokens: List[str], emotion_id: str) -> List[AnimationToken]:
        stream: List[AnimationToken] = []
        emotion_lower = emotion_id.lower()
        emotion_inserted = emotion_lower not in _SENTIMENT_WORDS

        for token in asl_tokens:
            token_upper = token.upper()
            token_type = self._classify_token(token_upper)

            if not emotion_inserted and token_type == "gesture":
                stream.append(AnimationToken(token=emotion_id.upper(), type="sentiment"))
                emotion_inserted = True

            stream.append(AnimationToken(token=token_upper, type=token_type))

        if not emotion_inserted and emotion_lower in _SENTIMENT_WORDS:
            stream.append(AnimationToken(token=emotion_id.upper(), type="sentiment"))

        return stream

    def format_api_response(
        self,
        processed_text: str,
        asl_grammar_output: str,
        asl_tokens: List[str],
        emotion_id: str,
    ) -> TextInputResponse:
        logger.info("OutputService: Formatting unified animation stream response.")
        animation_stream = self.build_animation_stream(asl_tokens, emotion_id)
        return TextInputResponse(
            message="Text input received and processed successfully.",
            processed_text=processed_text,
            asl_grammar_output=asl_grammar_output,
            animation_stream=animation_stream,
        )
