from fastapi import APIRouter, HTTPException
import os
import logging

router = APIRouter(prefix="/api/v1/avatars", tags=["avatars"])
logger = logging.getLogger(__name__)

@router.get("/")
async def get_avatars():
    """
    Scans the frontend animations directory to dynamically list available characters.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
    sentiments_dir = os.path.join(base_dir, "frontend", "t81-frontend", "public", "animations", "sentiments")
    
    if not os.path.exists(sentiments_dir):
        logger.error(f"Sentiments directory not found: {sentiments_dir}")
        raise HTTPException(status_code=500, detail="Animations directory not found.")
        
    try:
        characters = [d for d in os.listdir(sentiments_dir) if os.path.isdir(os.path.join(sentiments_dir, d))]
        return {"characters": sorted(characters)}
    except Exception as e:
        logger.exception("Failed to scan sentiments directory.")
        raise HTTPException(status_code=500, detail="Failed to list avatars.")
