from fastapi import APIRouter, Depends, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated
from app.api.dependencies import get_current_user, get_db, check_csrf_token
from app.core.responses import success_response
from app.models.user import UserDBModel
from app.models.feedback import FeedbackDBModel
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.core.rate_limit import limiter
router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback"])

@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit Feedback", description="Allows an authenticated user to submit system feedback or support tickets. Requires CSRF token.")
@limiter.limit("5/minute")
async def create_feedback(
    request: Request,
    payload: FeedbackCreate,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    csrf: Annotated[bool, Depends(check_csrf_token)]
):
    feedback_doc = FeedbackDBModel(
        user_id=str(current_user.id),
        subject=payload.subject,
        message=payload.message
    )
    
    result = await db["feedback"].insert_one(feedback_doc.model_dump(by_alias=True))
    
    if not result.inserted_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback at this time."
        )
        
    saved_doc = await db["feedback"].find_one({"_id": result.inserted_id})
    data = FeedbackResponse(**saved_doc, id=str(saved_doc["_id"]))
    return success_response("Feedback submitted successfully", data=data.model_dump(), status_code=201)
