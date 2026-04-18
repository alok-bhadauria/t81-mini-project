from typing import Annotated
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_user
from app.schemas.text import TextInputRequest, TextInputResponse
from app.models.user import UserDBModel
from app.db.task_repository import TaskRepository
from app.services.e_orchestrator import PipelineOrchestrator
from fastapi import Request
from app.core.rate_limit import limiter

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
    
    repository = TaskRepository(db)
    orchestrator = PipelineOrchestrator(repository)
    
    return await orchestrator.run(
        raw_text=payload.text,
        user_id=str(current_user.id),
        input_type=payload.type.value,
        file_metadata=metadata
    )
