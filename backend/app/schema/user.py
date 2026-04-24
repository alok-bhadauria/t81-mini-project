from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.base import SanitizedBaseModel
from datetime import datetime
import re

class UserCreateRequest(SanitizedBaseModel):
    email: EmailStr
    password: str = Field(
        ..., 
        min_length=8,
        description="Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
    )
    full_name: str

    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least 1 uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least 1 lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least 1 number')
        if not re.search(r'[@$!%*?&]', v):
            raise ValueError('Password must contain at least 1 special character (@, $, !, %, *, ?, &)')
        return v

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str | None = None
    full_name: str
    bio: str | None = None
    phone_number: str | None = None
    profile_picture_url: str | None = None
    auth_provider: str
    plan: str
    created_at: datetime

class UserUpdateRequest(SanitizedBaseModel):
    full_name: str | None = Field(None, max_length=100)
    username: str | None = Field(None, pattern=r"^[a-zA-Z0-9_.-]{3,30}$", description="Alphanumeric with dot, underscore, dash")
    bio: str | None = Field(None, max_length=500)
    phone_number: str | None = Field(None, pattern=r"^\+?[1-9]\d{1,14}$", description="E.164 standard phone number")
    profile_picture_url: str | None = None

class PasswordUpdateRequest(SanitizedBaseModel):
    current_password: str
    new_password: str = Field(
        ..., 
        min_length=8,
        description="Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
    )

    @field_validator('new_password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least 1 uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least 1 lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least 1 number')
        if not re.search(r'[@$!%*?&]', v):
            raise ValueError('Password must contain at least 1 special character (@, $, !, %, *, ?, &)')
        return v

class GoogleAuthRequest(BaseModel):
    access_token: str
