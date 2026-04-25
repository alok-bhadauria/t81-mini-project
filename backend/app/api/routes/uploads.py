from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Path
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_user, check_csrf_token
from app.core.responses import success_response
from app.models.user import UserDBModel
from app.models.task import PyObjectId
from bson.errors import InvalidId
from app.core.rate_limit import limiter
router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])

@router.get("", summary="Get Uploaded Documents", description="Retrieves the past 50 document translation uploads for the authenticated user.")
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
    cursor = db["tasks"].aggregate(pipeline)
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
    return success_response("Uploads fetched successfully", data=results)

@router.delete("/{upload_id}", summary="Delete Uploaded Document", description="Deletes a specific document upload securely. Admins can delete any item. Requires CSRF token.")
@limiter.limit("20/minute")
async def delete_upload_item(
    request: Request,
    upload_id: Annotated[str, Path(pattern="^[a-fA-F0-9]{24}$", description="Valid MongoDB ObjectId")],
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    csrf: Annotated[bool, Depends(check_csrf_token)]
):
    try:
        obj_id = PyObjectId(upload_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid upload ID format")

    query = {"_id": obj_id}
    if current_user.role != "admin":
        query["user_id"] = str(current_user.id)

    result = await db["tasks"].delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Upload not found or unauthorized")
        
    return success_response("Upload deleted successfully")
