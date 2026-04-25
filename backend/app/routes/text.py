import asyncio
import logging
import time
from typing import Annotated
from fastapi import APIRouter, Depends, Request, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_user, get_orchestrator, check_csrf_token
from app.core.responses import success_response
from app.schemas.text import TextInputRequest, TextInputResponse
from app.models.user import UserDBModel
from app.services.h_orchestrator import PipelineOrchestrator
from app.core.rate_limit import limiter
from app.core.exceptions import AppException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/text", tags=["text"])

ROUTE_TIMEOUT_SECONDS = 25.0


@router.post("", summary="Process Text Input", description="Processes raw text input through the AI translation pipeline and triggers background ASL animation generation.")
@limiter.limit("60/minute")
async def accept_text_input(
    request: Request,
    payload: TextInputRequest,
    background_tasks: BackgroundTasks,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    orchestrator: Annotated[PipelineOrchestrator, Depends(get_orchestrator)],
    csrf: Annotated[bool, Depends(check_csrf_token)],
):
    start_time = time.monotonic()
    metadata = {"filename": payload.filename} if payload.filename else None

    try:
        result, persist_kwargs = await asyncio.wait_for(
            orchestrator.run(
                raw_text=payload.text,
                user_id=str(current_user.id),
                input_type=payload.type.value,
                file_metadata=metadata,
            ),
            timeout=ROUTE_TIMEOUT_SECONDS,
        )
        background_tasks.add_task(orchestrator._persist_task, **persist_kwargs)
    except asyncio.TimeoutError:
        duration = time.monotonic() - start_time
        logger.error(f"Route: Pipeline timed out after {duration:.3f}s for user {current_user.id}.")
        raise AppException("Request timed out. Please try again.", 504)

    duration = time.monotonic() - start_time
    logger.info(f"Route: Request completed in {duration:.3f}s for user {current_user.id}.")
    return success_response("Translation successful", data=result)
