from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Path
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_user, check_csrf_token
from app.core.responses import success_response
from app.models.user import UserDBModel
from app.models.task import PyObjectId
from bson.errors import InvalidId
from app.core.rate_limit import limiter

router = APIRouter(prefix="/api/v1/history", tags=["history"])


@router.get("", summary="Get User History", description="Retrieves the past 50 translation items for the authenticated user.")
@limiter.limit("30/minute")
async def get_history(
    request: Request,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    pipeline = [
        {"$match": {"user_id": str(current_user.id), "input_type": {"$in": ["TEXT", "SPEECH"]}}},
        {"$sort": {"created_at": -1}},
        {"$limit": 50}
    ]
    cursor = db["tasks"].aggregate(pipeline)
    items = await cursor.to_list(length=50)
    
    results = []
    for item in items:
        results.append({
            "id": str(item["_id"]),
            "text": item.get("input_text", ""),
            "asl": item.get("asl_grammar_output", ""),
            "date": item.get("created_at").isoformat() if item.get("created_at") else ""
        })
    return success_response("History fetched successfully", data=results)

@router.delete("/{history_id}", summary="Delete History Item", description="Deletes a specific history item securely. Admins can delete any item. Requires CSRF token.")
@limiter.limit("20/minute")
async def delete_history_item(
    request: Request,
    history_id: Annotated[str, Path(pattern="^[a-fA-F0-9]{24}$", description="Valid MongoDB ObjectId")],
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    csrf: Annotated[bool, Depends(check_csrf_token)]
):
    try:
        obj_id = PyObjectId(history_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid history ID format")

    query = {"_id": obj_id}
    if current_user.role != "admin":
        query["user_id"] = str(current_user.id)

    result = await db["tasks"].delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History not found or unauthorized")
        
    return success_response("History and associated outputs deleted")
