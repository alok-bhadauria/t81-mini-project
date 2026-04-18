import json
import logging
import os
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

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

    def get_sentiment_id(self, emotion: str) -> str:
        return self._sentiment_map.get(emotion.upper(), "sa003")
        
    def _get_gesture_animation_ids(self, asl_tokens: List[str]) -> List[str]:
        if not self._gesture_map:
            raise RuntimeError("Gesture map not initialized")
        animation_ids: List[str] = []
        for token in asl_tokens:
            token_upper = token.upper()
            if token_upper in self._gesture_map:
                animation_ids.append(self._gesture_map[token_upper])
            else:
                for char in token_upper:
                    if char.isalpha():
                        animation_ids.append(f"gaLET_{char}")
                    elif char.isdigit():
                        animation_ids.append(f"gaNUM_{char}")
        return animation_ids

    def map(self, emotion_id: str, asl_tokens: List[str]) -> Dict[str, Any]:
        logger.info("AnimationService: Mapping generated tree against static dictionary")
        sa_id = self.get_sentiment_id(emotion_id)
        
        animation_seq = []
        all_ga_ids = []
        
        for token in asl_tokens:
            token_ga_ids = self._get_gesture_animation_ids([token])
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
