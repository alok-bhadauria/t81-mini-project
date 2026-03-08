from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_user
from app.models.user import UserDBModel
from app.models.translation import PyObjectId
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])

@router.get("")
@limiter.limit("30/minute")
async def get_uploads(
    request: Request,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    pipeline = [
        {"$match": {"user_id": str(current_user.id), "input_type": "DOCUMENT"}},
        {"$sort": {"created_at": -1}},
        {"$limit": 50}
    ]
    cursor = db["translations"].aggregate(pipeline)
    items = await cursor.to_list(length=50)
    
    results = []
    for item in items:
        metadata = item.get("file_metadata") or {}
        filename = metadata.get("filename") or "Unknown Document"
        results.append({
            "id": str(item["_id"]),
            "name": filename,
            "description": f"Extracted text: {item.get('input_text', '')[:80]}...",
            "date": item.get("created_at").isoformat() if item.get("created_at") else ""
        })
    return results

@router.delete("/{upload_id}")
@limiter.limit("20/minute")
async def delete_upload_item(
    request: Request,
    upload_id: str,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    result = await db["translations"].delete_one({"_id": PyObjectId(upload_id), "user_id": str(current_user.id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Upload not found or unauthorized")
        
    return {"message": "Upload deleted"}
