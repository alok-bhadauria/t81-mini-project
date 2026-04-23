import json
import logging
import os
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_LETTER_KEY_MAP = {chr(c): chr(c) for c in range(ord("A"), ord("Z") + 1)}
_LETTER_KEY_MAP["I"] = "I_LETTER"


class AnimationService:
    _gesture_map = None
    _sentiment_map = None

    def __init__(self):
        self._load_mappings()

    @classmethod
    def _load_mappings(cls):
        if cls._gesture_map is not None and cls._sentiment_map is not None:
            return

        logger.info("AnimationService: Loading JSON maps into Singleton memory cache.")

        base_dir = os.path.dirname(os.path.dirname(__file__))
        gesture_path = os.path.join(base_dir, "data", "gesture_map.json")
        sentiment_path = os.path.join(base_dir, "data", "sentiment_map.json")

        try:
            with open(gesture_path, "r") as f:
                cls._gesture_map = json.load(f)
            with open(sentiment_path, "r") as f:
                cls._sentiment_map = json.load(f)
        except Exception as e:
            logger.exception("AnimationService failed to load maps:")
            raise RuntimeError("Failed to load animation maps") from e

    def get_gesture_map(self) -> dict:
        return self._gesture_map or {}

    def get_sentiment_id(self, emotion: str) -> str:
        return self._sentiment_map.get(emotion.upper(), "sa003")

    def _fingerspell(self, word: str) -> List[str]:
        ids = []
        for char in word.upper():
            if char.isalpha():
                key = _LETTER_KEY_MAP.get(char, char)
                gid = self._gesture_map.get(key)
                if gid:
                    ids.append(gid)
            elif char.isdigit():
                gid = self._gesture_map.get(char)
                if gid:
                    ids.append(gid)
        return ids

    def _get_gesture_animation_ids(self, token: str) -> List[str]:
        token_upper = token.upper()

        if token_upper in self._gesture_map:
            return [self._gesture_map[token_upper]]

        logger.debug(f"AnimationService: '{token_upper}' not in gesture map — fingerspelling.")
        return self._fingerspell(token_upper)

    def map(self, emotion_id: str, asl_tokens: List[str]) -> Dict[str, Any]:
        logger.info("AnimationService: Mapping generated tree against static dictionary")
        sa_id = self.get_sentiment_id(emotion_id)

        animation_seq = []
        all_ga_ids = []

        for token in asl_tokens:
            token_ga_ids = self._get_gesture_animation_ids(token)
            animation_seq.append({
                "word": token.upper(),
                "gesture_animation_ids": token_ga_ids
            })
            all_ga_ids.extend(token_ga_ids)

        return {
            "sentiment_animation_id": sa_id,
            "gesture_animation_ids": all_ga_ids,
            "animation_sequence": animation_seq
        }
