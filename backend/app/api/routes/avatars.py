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
    gestures_dir = os.path.join(base_dir, "frontend", "t81-frontend", "public", "animations", "gestures")
    
    if not os.path.exists(gestures_dir):
        logger.error(f"Avatars directory not found: {gestures_dir}")
        raise HTTPException(status_code=500, detail="Animations directory not found.")
        
    try:
        characters = [d for d in os.listdir(gestures_dir) if os.path.isdir(os.path.join(gestures_dir, d))]
        return {"characters": sorted(characters)}
    except Exception as e:
        logger.exception("Failed to scan avatars directory.")
        raise HTTPException(status_code=500, detail="Failed to list avatars.")
