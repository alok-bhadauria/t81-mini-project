from datetime import datetime, timedelta
from typing import Optional, Union, Any
import secrets
from passlib.context import CryptContext
from jose import jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "iss": "SignFusion"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.jwt_secret_key, 
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any]) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)

def verify_csrf_token(header_token: str, cookie_token: str) -> bool:
    if not header_token or not cookie_token:
        return False
    return secrets.compare_digest(header_token, cookie_token)
