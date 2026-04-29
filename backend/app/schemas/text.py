from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from app.schemas.base import SanitizedBaseModel


class InputType(str, Enum):
    TEXT = "TEXT"
    SPEECH = "SPEECH"
    DOCUMENT = "DOCUMENT"


class AnimationToken(BaseModel):
    token: str
    type: str


class TextInputRequest(SanitizedBaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="The textual input from the user/speech recognition")
    type: InputType = Field(InputType.TEXT, description="Source of the text (TEXT, SPEECH, or DOCUMENT)")
    filename: Optional[str] = Field(None, pattern=r"^[\w\-. ]+$", description="Optional filename if document was uploaded")


class TextInputResponse(BaseModel):
    message: str
    processed_text: str
    asl_grammar_output: str
    animation_stream: List[AnimationToken]
