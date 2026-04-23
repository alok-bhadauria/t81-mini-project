from typing import Annotated
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongodb import get_database
from app.core.config import settings
from app.models.user import UserDBModel
from app.core.logging_config import user_id_var
from app.core.security import verify_csrf_token
from app.core.exceptions import AppException
from app.services.a_preprocess_service import PreprocessService
from app.services.b_gemini_translation_service import GeminiTranslationService
from app.services.c_ai_translation_service import AITranslationService
from app.services.f_animation_service import AnimationService
from app.services.g_output_service import OutputService
from app.services.h_orchestrator import PipelineOrchestrator
from app.db.task_repository import TaskRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_db():
    return get_database()

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> UserDBModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception

    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise credentials_exception

    user_doc = await db["users"].find_one({"_id": obj_id})
    if user_doc is None:
        raise credentials_exception

    user = UserDBModel(**user_doc)
    user_id_var.set(str(user.id))
    return user

async def check_csrf_token(request: Request):
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("X-CSRF-Token")
        
        if not csrf_cookie or not csrf_header or not verify_csrf_token(csrf_header, csrf_cookie):
            raise AppException("CSRF token verification failed.", status_code=403)
    return True

async def get_current_admin_user(
    current_user: Annotated[UserDBModel, Depends(get_current_user)]
) -> UserDBModel:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user

def get_orchestrator(db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> PipelineOrchestrator:
    return PipelineOrchestrator(
        repository=TaskRepository(db),
        preprocess=PreprocessService(),
        gemini_translation=GeminiTranslationService(),
        ai_translation=AITranslationService(),
        animation_service=AnimationService(),
        output_service=OutputService(),
    )
