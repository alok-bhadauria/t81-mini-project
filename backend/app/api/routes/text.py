from typing import Annotated
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_user
from app.schemas.text import TextInputRequest, TextInputResponse
from app.models.user import UserDBModel
from app.services import step0_input_handler
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/v1/text", tags=["text"])

@router.post("", response_model=TextInputResponse)
@limiter.limit("60/minute")
async def accept_text_input(
    request: Request,
    payload: TextInputRequest,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    metadata = {"filename": payload.filename} if payload.filename else None
    translation_response = await step0_input_handler.process_raw_text(
        text=payload.text,
        user_id=str(current_user.id),
        db=db,
        input_type=payload.type, file_metadata=metadata)
    
    return TextInputResponse(
        message="Text input received and stored successfully.",
        processed_text=translation_response.processed_text,
        asl_grammar_output=translation_response.asl_grammar_output,
        sentiment_animation_id=translation_response.sentiment_animation_id,
        gesture_animation_ids=translation_response.gesture_animation_ids,
        animation_sequence=translation_response.animation_sequence
    )
