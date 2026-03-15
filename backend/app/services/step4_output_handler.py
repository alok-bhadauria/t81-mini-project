import uuid
from typing import Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.task import TaskDBModel

async def save_and_return_output(
    user_id: str,
    input_type: str,
    raw_text: str,
    file_metadata: Optional[Dict[str, Any]],
    nlp_data: Dict[str, Any],
    asl_data: Dict[str, Any],
    animation_data: Dict[str, Any],
    db: AsyncIOMotorDatabase
) -> TaskDBModel:
    custom_task_id = f"sfip{str(uuid.uuid4().int)[:10]}"
    
    new_task = TaskDBModel(
        user_id=user_id,
        task_id=custom_task_id,
        input_type=input_type,
        input_text=raw_text,
        input_doc_address=file_metadata.get("url") if file_metadata else None,
        file_metadata=file_metadata,
        processed_text=nlp_data.get("processed_text", ""),
        asl_grammar_output=asl_data.get("asl_grammar_output", ""),
        gesture_sequence=asl_data.get("gesture_sequence", []),
        emotion_id=nlp_data.get("emotion_id", "NEUTRAL"),
        sentiment_animation_id=animation_data.get("sentiment_animation_id", "sa003"),
        gesture_animation_ids=animation_data.get("gesture_animation_ids", []),
        animation_sequence=animation_data.get("animation_sequence", [])
    )
    
    await db["tasks"].insert_one(
        new_task.model_dump(by_alias=True, exclude=["id"])
    )
    
    return new_task
