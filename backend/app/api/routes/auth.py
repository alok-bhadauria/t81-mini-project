from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
import uuid
import logging
import cloudinary
import cloudinary.uploader
import httpx
from pydantic import BaseModel

from app.api.dependencies import get_db, get_current_user, check_csrf_token
from app.core.sanitization import sanitize_query
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, generate_csrf_token
from app.core.rate_limit import limiter
from app.models.user import UserDBModel
from app.schemas.user import UserCreateRequest, UserResponse, GoogleAuthRequest, UserUpdateRequest, PasswordUpdateRequest
from app.core.responses import success_response, error_response
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register New User", description="Creates a new local user account with email and password.")
@limiter.limit("10/minute")
async def register_user(
    request: Request,
    payload: UserCreateRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    existing_user = await db["users"].find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_pwd = get_password_hash(payload.password)
    username = f"sf{str(uuid.uuid4().int)[:10]}"

    new_user = UserDBModel(
        email=payload.email,
        username=username,
        hashed_password=hashed_pwd,
        auth_provider="LOCAL",
        full_name=payload.full_name,
        plan="free"
    )

    try:
        result = await db["users"].insert_one(new_user.model_dump(by_alias=True, exclude=["id"]))
    except DuplicateKeyError:
        logger.exception("Duplicate key error during registration:")
        raise HTTPException(status_code=400, detail="Username or Email already registered.")

    new_user.id = result.inserted_id

    data = UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        auth_provider=new_user.auth_provider,
        plan=new_user.plan,
        created_at=new_user.created_at
    )
    return success_response("User registered successfully", data=data.model_dump(), status_code=201)


class UsernameCheckResponse(BaseModel):
    available: bool


@router.get("/check-username", summary="Check Username Availability", description="Verifies if a requested username is available or already taken.")
@limiter.limit("30/minute")
async def check_username(
    request: Request,
    username: Annotated[str, Depends(sanitize_query)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    if not username or len(username) < 3 or len(username) > 30:
        return success_response("Username check", data={"available": False})

    user_doc = await db["users"].find_one({"username": username})
    return success_response("Username check", data={"available": user_doc is None})


@router.post("/login", summary="Login User", description="Authenticates a user and returns JWT access/refresh tokens alongside a CSRF token.")
@limiter.limit("10/minute")
async def login_user(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    identifier = form_data.username
    user_doc = await db["users"].find_one({
        "$or": [{"email": identifier}, {"username": identifier}]
    })

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = UserDBModel(**user_doc)

    if user.auth_provider == "LOCAL" and not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    csrf_token = generate_csrf_token()

    hashed_rt = get_password_hash(refresh_token)
    await db["refresh_tokens"].insert_one({
        "user_id": user.id,
        "token_hash": hashed_rt,
        "created_at": datetime.utcnow()
    })

    resp_data = success_response(
        message="Login successful",
        data={"access_token": access_token, "token_type": "bearer", "csrf_token": csrf_token}
    )
    response = JSONResponse(content=resp_data)
    response.set_cookie(key="csrf_token", value=csrf_token, httponly=False, samesite="strict")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, samesite="strict")
    return response

@router.post("/refresh", summary="Refresh Access Token", description="Issues a new access token using a valid HttpOnly refresh token cookie.")
@limiter.limit("5/minute")
async def refresh_token_endpoint(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    try:
        from app.core.config import settings
        from jose import jwt
        payload = jwt.decode(refresh_token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    # Optional: We could verify hash against DB here for strict statefulness
    access_token = create_access_token(subject=user_id)
    return success_response("Token refreshed", data={"access_token": access_token, "token_type": "bearer"})


@router.post("/google", summary="Google OAuth Login", description="Authenticates a user via Google OAuth2 access token and issues local JWT tokens.")
@limiter.limit("10/minute")
async def google_auth(
    request: Request,
    payload: GoogleAuthRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {payload.access_token}"}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google access token")

            user_info = response.json()
            email = user_info["email"]
            name = user_info.get("name", "Google User")
            google_id = user_info["sub"]
    except httpx.RequestError:
        logger.exception("Google auth network request failed:")
        raise HTTPException(status_code=503, detail="Google authentication service unavailable")

    user_doc = await db["users"].find_one({"email": email})
    is_new_user = False

    if not user_doc:
        is_new_user = True
        username = f"sf{str(uuid.uuid4().int)[:10]}"
        new_user = UserDBModel(
            email=email,
            username=username,
            auth_provider="GOOGLE",
            google_id=google_id,
            full_name=name,
            plan="free"
        )
        try:
            result = await db["users"].insert_one(new_user.model_dump(by_alias=True, exclude=["id"]))
            user_id = str(result.inserted_id)
        except DuplicateKeyError:
            logger.exception("Duplicate key error during Google auth:")
            raise HTTPException(status_code=400, detail="Failed to complete registration due to duplicate constraints.")
    else:
        user_id = str(user_doc["_id"])

    access_token = create_access_token(subject=user_id)
    return success_response("Google authentication successful", data={"access_token": access_token, "token_type": "bearer", "is_new_user": is_new_user})


@router.get("/me", summary="Get Current User Profile", description="Retrieves the profile information of the currently authenticated user.", response_model=UserResponse)
@limiter.limit("30/minute")
async def get_my_profile(
    request: Request,
    current_user: Annotated[UserDBModel, Depends(get_current_user)]
):
    data = UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        bio=current_user.bio,
        phone_number=current_user.phone_number,
        profile_picture_url=current_user.profile_picture_url,
        auth_provider=current_user.auth_provider,
        plan=current_user.plan,
        created_at=current_user.created_at
    )
    return success_response("Profile fetched successfully", data=data.model_dump())


@router.get("/me/stats", summary="Get User Statistics", description="Retrieves usage statistics such as total translations and saved documents for the current user.")
@limiter.limit("30/minute")
async def get_my_stats(
    request: Request,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    translations_count = await db["tasks"].count_documents({"user_id": str(current_user.id)})
    saved_items_count = await db["tasks"].count_documents({"input_type": "DOCUMENT", "user_id": str(current_user.id)})
    return success_response("Stats fetched successfully", data={
        "translations": translations_count,
        "saved_items": saved_items_count,
        "plan": current_user.plan
    })


@router.put("/me", summary="Update User Profile", description="Updates profile fields like bio, full name, or username for the current user. Requires CSRF token.")
@limiter.limit("20/minute")
async def update_my_profile(
    request: Request,
    payload: UserUpdateRequest,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    csrf: Annotated[bool, Depends(check_csrf_token)]
):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")
    if "username" in update_data:
        if len(update_data["username"]) < 5 or len(update_data["username"]) > 20:
            raise HTTPException(status_code=400, detail="Username must be between 5 and 20 characters")
        if await db["users"].find_one({"username": update_data["username"], "_id": {"$ne": current_user.id}}):
            raise HTTPException(status_code=400, detail="Username is already taken")

    result = await db["users"].find_one_and_update(
        {"_id": current_user.id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = UserDBModel(**result)
    data = UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        full_name=updated_user.full_name,
        bio=updated_user.bio,
        phone_number=updated_user.phone_number,
        username=updated_user.username,
        profile_picture_url=updated_user.profile_picture_url,
        auth_provider=updated_user.auth_provider,
        plan=updated_user.plan,
        created_at=updated_user.created_at
    )
    return success_response("Profile updated successfully", data=data.model_dump())


@router.post("/me/avatar", summary="Upload User Avatar", description="Uploads and updates the user's profile picture using Cloudinary. Requires CSRF token.")
@limiter.limit("5/minute")
async def upload_avatar(
    request: Request,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    csrf: Annotated[bool, Depends(check_csrf_token)],
    file: UploadFile = File(...)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 5MB limit.")

    try:
        upload_result = cloudinary.uploader.upload(
            file_bytes,
            folder="signfusion_avatars",
            public_id=f"avatar_{current_user.id}",
            overwrite=True
        )
        secure_url = upload_result.get("secure_url")
    except Exception:
        logger.exception("Cloudinary upload failed:")
        secure_url = f"https://ui-avatars.com/api/?name={current_user.full_name.replace(' ', '+')}&background=random"

    result = await db["users"].find_one_and_update(
        {"_id": current_user.id},
        {"$set": {"profile_picture_url": secure_url}},
        return_document=ReturnDocument.AFTER
    )

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = UserDBModel(**result)
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        full_name=updated_user.full_name,
        bio=updated_user.bio,
        phone_number=updated_user.phone_number,
        username=updated_user.username,
        profile_picture_url=updated_user.profile_picture_url,
        auth_provider=updated_user.auth_provider,
        plan=updated_user.plan,
        created_at=updated_user.created_at
    )


@router.put("/password", summary="Change Password", description="Updates the password for a local user account. Requires CSRF token.")
@limiter.limit("5/minute")
async def update_password(
    request: Request,
    payload: PasswordUpdateRequest,
    current_user: Annotated[UserDBModel, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    csrf: Annotated[bool, Depends(check_csrf_token)]
):
    if current_user.auth_provider != "LOCAL":
        raise HTTPException(status_code=400, detail="Cannot change password for social login accounts")

    if not current_user.hashed_password or not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    hashed_pwd = get_password_hash(payload.new_password)
    await db["users"].update_one(
        {"_id": current_user.id},
        {"$set": {"hashed_password": hashed_pwd}}
    )

    return success_response("Password updated successfully")
