from pydantic import BaseModel, field_validator
from typing import List
from enum import Enum


class AIEmotion(str, Enum):
    HAPPY = "HAPPY"
    SAD = "SAD"
    NEUTRAL = "NEUTRAL"


class AITranslationResult(BaseModel):
    asl_text: str
    tokens: List[str]
    emotion: str

    @field_validator("asl_text")
    @classmethod
    def asl_text_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("asl_text must not be empty")
        return v.strip()

    @field_validator("tokens")
    @classmethod
    def tokens_must_not_be_empty(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("tokens must not be empty")
        return [str(t).upper() for t in v]

    @field_validator("emotion")
    @classmethod
    def normalize_emotion(cls, v: str) -> str:
        normalized = v.strip().upper()
        if normalized not in [e.value for e in AIEmotion]:
            return AIEmotion.NEUTRAL.value
        return normalized
