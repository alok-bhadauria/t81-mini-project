from fastapi import APIRouter, Depends, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated
from app.api.dependencies import get_current_user, get_db
from app.models.user import UserDBModel
from app.models.feedback import FeedbackDBModel
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.core.rate_limit import limiter
router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback"])

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_feedback(
    request: Request,
    payload: FeedbackCreate,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
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
    return FeedbackResponse(**saved_doc, id=str(saved_doc["_id"]))
