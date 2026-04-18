from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.str_schema(),
        ])

class TaskDBModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str 
    task_id: str
    input_type: str
    input_text: str
    input_doc_address: Optional[str] = None
    processed_text: Optional[str] = None
    asl_grammar_output: Optional[str] = None
    emotion_id: Optional[str] = None
    sentiment_animation_id: Optional[str] = None
    gesture_animation_ids: Optional[list] = None
    animation_sequence: Optional[list] = None
    file_metadata: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
