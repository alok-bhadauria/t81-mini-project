import json
import logging
import os
from typing import Dict, Any

logger = logging.getLogger(__name__)


class AnimationService:
    _registry: Dict[str, Any] = None

    def __init__(self):
        self._load_registry()

    @classmethod
    def _load_registry(cls):
        if cls._registry is not None:
            return

        base_dir = os.path.dirname(os.path.dirname(__file__))
        registry_path = os.path.join(base_dir, "data", "gesture_map.json")

        try:
            with open(registry_path, "r") as f:
                cls._registry = json.load(f)
        except Exception as e:
            logger.exception("AnimationService: Failed to load animation registry.")
            raise RuntimeError("Failed to load animation registry.") from e

    def get_animation_registry(self) -> Dict[str, Any]:
        return self._registry or {}
