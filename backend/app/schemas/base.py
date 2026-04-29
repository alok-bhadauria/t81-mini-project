from pydantic import BaseModel, model_validator
from app.core.sanitization import sanitize_text
from typing import Any

class SanitizedBaseModel(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def sanitize_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str):
                    data[key] = sanitize_text(value)
        return data
