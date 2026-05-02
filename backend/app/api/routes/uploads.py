from typing import Annotated
import asyncio
import time
import logging
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, Request, Path, UploadFile, File, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.dependencies import get_db, get_current_user, check_csrf_token, get_orchestrator
from app.core.responses import success_response
from app.models.user import UserDBModel
from app.models.task import PyObjectId
from bson.errors import InvalidId
from app.core.rate_limit import limiter
from app.services.h_orchestrator import PipelineOrchestrator
from app.core.exceptions import AppException
from app.services.pdf_service import extract_text_from_pdf

logger = logging.getLogger(__name__)
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
            "date": item.get("created_at").isoformat() if item.get("created_at") else "",
            "text": item.get("input_text", ""),
            "asl": item.get("asl_grammar_output", ""),
            "animation_stream": item.get("animation_stream", []),
            "url": metadata.get("url", "")
        })
    return success_response("Uploads fetched successfully", data=results)

@router.post("", summary="Upload Document", description="Uploads a text or PDF document, saves it to Cloudinary, and processes it through the ASL pipeline.")
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    orchestrator: Annotated[PipelineOrchestrator, Depends(get_orchestrator)],
    csrf: Annotated[bool, Depends(check_csrf_token)],
    file: UploadFile = File(...)
):
    start_time = time.monotonic()

    if not file.filename.lower().endswith(('.txt', '.pdf')):
        raise HTTPException(status_code=400, detail="Only .txt and .pdf files are supported.")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # Extract text based on file type
    try:
        if file.filename.lower().endswith('.pdf'):
            extracted_text = extract_text_from_pdf(file_bytes)
        else:
            extracted_text = file_bytes.decode("utf-8")
    except Exception as e:
        logger.error(f"Failed to read file {file.filename}: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to read or decode file contents.")

    extracted_text = extracted_text.strip()
    if not extracted_text:
        raise HTTPException(status_code=400, detail="File is empty or contains no readable text.")

    # Limit text length to avoid overloading the pipeline
    extracted_text = extracted_text[:2000]

    # Upload to Cloudinary
    try:
        upload_result = cloudinary.uploader.upload(
            file_bytes,
            folder="signfusion_documents",
            resource_type="raw",
            public_id=f"doc_{current_user.id}_{int(time.time())}_{file.filename}"
        )
        secure_url = upload_result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {str(e)}")
        secure_url = ""

    metadata = {"filename": file.filename, "url": secure_url}

    try:
        result, persist_kwargs = await asyncio.wait_for(
            orchestrator.run(
                raw_text=extracted_text,
                user_id=str(current_user.id),
                input_type="DOCUMENT",
                file_metadata=metadata,
            ),
            timeout=25.0,
        )
        background_tasks.add_task(orchestrator._persist_task, **persist_kwargs)
    except asyncio.TimeoutError:
        duration = time.monotonic() - start_time
        logger.error(f"Route: Pipeline timed out after {duration:.3f}s for user {current_user.id}.")
        raise AppException("Request timed out. Please try again.", 504)

    duration = time.monotonic() - start_time
    logger.info(f"Route: Document upload and request completed in {duration:.3f}s for user {current_user.id}.")
    
    # Return everything including the extracted text
    data_out = result.model_dump()
    data_out["extracted_text"] = extracted_text
    data_out["url"] = secure_url
    
    return success_response("Document processed successfully", data=data_out)

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
