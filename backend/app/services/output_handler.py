import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.translation import TranslationDBModel

async def save_and_return_output(
    user_id: str,
    input_type: str,
    raw_text: str,
    file_metadata: dict,
    nlp_data: dict,
    asl_data: dict,
    db: AsyncIOMotorDatabase
) -> TranslationDBModel:
    
    custom_task_id = f"sfip{str(uuid.uuid4().int)[:10]}"
    
    new_translation = TranslationDBModel(
        user_id=user_id,
        task_id=custom_task_id,
        input_type=input_type,
        input_text=raw_text,
        input_doc_address=file_metadata.get("url") if file_metadata else None,
        file_metadata=file_metadata,
        processed_text=" ".join(nlp_data["tokens"]),
        asl_grammar_output=asl_data["asl_grammar_output"],
        gesture_sequence=asl_data["gesture_sequence"],
        emotion_id=nlp_data["emotion_id"]
    )
    
    await db["translations"].insert_one(
        new_translation.model_dump(by_alias=True, exclude=["id"])
    )
    
    return new_translation
