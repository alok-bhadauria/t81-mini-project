from fastapi import APIRouter, HTTPException
import os
import logging

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])
logger = logging.getLogger(__name__)

@router.get("/")
async def get_courses():
    """
    Scans the frontend public/learn directory and builds a course structure:
    Language -> Modules -> Items
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
    learn_dir = os.path.join(base_dir, "frontend", "t81-frontend", "public", "learn")
    
    if not os.path.exists(learn_dir):
        logger.error(f"Learn directory not found: {learn_dir}")
        return {"courses": []}
        
    courses = []
    try:
        languages = sorted([d for d in os.listdir(learn_dir) if os.path.isdir(os.path.join(learn_dir, d))])
        for lang in languages:
            lang_path = os.path.join(learn_dir, lang)
            modules = sorted([d for d in os.listdir(lang_path) if os.path.isdir(os.path.join(lang_path, d))])
            
            module_data = []
            for mod in modules:
                mod_path = os.path.join(lang_path, mod)
                files = sorted([f for f in os.listdir(mod_path) if os.path.isfile(os.path.join(mod_path, f))])
                
                items = []
                for file in files:
                    name, _ = os.path.splitext(file)
                    items.append({
                        "name": name,
                        "file": f"/learn/{lang}/{mod}/{file}"
                    })
                    
                module_data.append({
                    "name": mod,
                    "items": items
                })
                
            courses.append({
                "language": lang,
                "modules": module_data
            })
            
        return {"courses": courses}
    except Exception as e:
        logger.exception("Failed to scan learn directory.")
        raise HTTPException(status_code=500, detail="Failed to load courses.")
