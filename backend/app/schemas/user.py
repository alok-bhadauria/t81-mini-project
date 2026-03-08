from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
import re

class UserCreateRequest(BaseModel):
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
    user_id: str
    email: EmailStr
    username: str | None = None
    full_name: str
    bio: str | None = None
    phone_number: str | None = None
    profile_picture_url: str | None = None
    auth_provider: str
    created_at: datetime

class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    username: str | None = None
    bio: str | None = None
    phone_number: str | None = None
    profile_picture_url: str | None = None

class PasswordUpdateRequest(BaseModel):
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
