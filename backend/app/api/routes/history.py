from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_user
from app.models.user import UserDBModel
from app.models.translation import PyObjectId
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1/history", tags=["history"])

@router.get("")
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
    cursor = db["translations"].aggregate(pipeline)
    items = await cursor.to_list(length=50)
    
    results = []
    for item in items:
        results.append({
            "id": str(item["_id"]),
            "text": item.get("input_text", ""),
            "asl": item.get("asl_grammar_output", ""),
            "date": item.get("created_at").isoformat() if item.get("created_at") else ""
        })
    return results

@router.delete("/{history_id}")
@limiter.limit("20/minute")
async def delete_history_item(
    request: Request,
    history_id: str,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    result = await db["translations"].delete_one({"_id": PyObjectId(history_id), "user_id": str(current_user.id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History not found or unauthorized")
        
    return {"message": "History and associated outputs deleted"}
