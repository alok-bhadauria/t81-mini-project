from typing import Annotated
from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_admin_user
from app.models.user import UserDBModel
from app.core.responses import success_response
from app.core.rate_limit import limiter

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

@router.get("/stats", summary="Get System Statistics", description="Retrieves global system usage statistics. Accessible only by administrators.")
@limiter.limit("20/minute")
async def get_system_stats(
    request: Request,
    admin_user: Annotated[UserDBModel, Depends(get_current_admin_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    users_count = await db["users"].count_documents({})
    tasks_count = await db["tasks"].count_documents({})
    feedback_count = await db["feedback"].count_documents({})
    
    return success_response(
        "System statistics retrieved successfully",
        data={
            "total_users": users_count,
            "total_tasks": tasks_count,
            "total_feedback": feedback_count
        }
    )
