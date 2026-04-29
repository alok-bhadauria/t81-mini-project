from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from app.schemas.base import SanitizedBaseModel

class InputType(str, Enum):
    TEXT = "TEXT"
    SPEECH = "SPEECH"
    DOCUMENT = "DOCUMENT"

class TextInputRequest(SanitizedBaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="The textual input from the user/speech recognition")
    type: InputType = Field(InputType.TEXT, description="Source of the text (TEXT, SPEECH, or DOCUMENT)")
    filename: Optional[str] = Field(None, pattern=r"^[\w\-. ]+$", description="Optional filename if document was uploaded")
    
class TextInputResponse(BaseModel):
    message: str
    processed_text: str
    asl_grammar_output: str
    sentiment_animation_id: str
    gesture_animation_ids: list[str]
    animation_sequence: list[dict]
