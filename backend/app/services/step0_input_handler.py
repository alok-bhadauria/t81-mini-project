from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.task import TaskDBModel
from app.services.step1_document_handler import extract_text_from_document
from app.services.step2_text_processing import process_text_pipeline
from app.services.step3_asl_translation import translate_to_asl
from app.services.step3b_animation_mapper import map_animations
from app.services.step4_output_handler import save_and_return_output

async def process_raw_text(
    text: str,
    user_id: str,
    db: AsyncIOMotorDatabase,
    input_type: str = "TEXT",
    file_metadata: Optional[Dict[str, Any]] = None
) -> TaskDBModel:
    if input_type == "DOCUMENT" and file_metadata:
        extracted_text = extract_text_from_document(file_metadata)
        text = extracted_text if extracted_text else text

    if not text or not text.strip():
        raise ValueError("Input text cannot be empty after processing.")

    nlp_res = process_text_pipeline(text)
    asl_res = translate_to_asl(nlp_res)
    anim_res = map_animations(nlp_res, asl_res)

    return await save_and_return_output(
        user_id=user_id,
        input_type=input_type,
        raw_text=text,
        file_metadata=file_metadata,
        nlp_data=nlp_res,
        asl_data=asl_res,
        animation_data=anim_res,
        db=db
    )
