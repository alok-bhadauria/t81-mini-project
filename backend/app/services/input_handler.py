from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.text_processing import process_text_pipeline
from app.services.asl_translation import translate_to_asl
from app.services.output_handler import save_and_return_output
from app.services.document_handler import extract_text_from_document

async def process_raw_text(text: str, user_id: str, db: AsyncIOMotorDatabase, input_type="TEXT", file_metadata=None):
    if input_type == "DOCUMENT" and file_metadata:
        doc_string = extract_text_from_document(file_metadata)
        text = doc_string if doc_string else text
        
    nlp_res = process_text_pipeline(text)
    asl_res = translate_to_asl(nlp_res)
    
    return await save_and_return_output(
        user_id,
        input_type,
        text,
        file_metadata,
        nlp_res,
        asl_res,
        db
    )
