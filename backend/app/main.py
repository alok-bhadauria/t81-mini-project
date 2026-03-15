from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.core.config import settings
import cloudinary
from app.api.routes import text, auth, history, uploads, feedback
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.middleware.cors import CORSMiddleware

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    db = get_database()

    await db["users"].create_index("email", unique=True)
    
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True
    )
    
    yield
    await close_mongo_connection()

app = FastAPI(
    title="SignFusion Backend API",
    description="Scalable backend for handling multimodal Sign Language translation requests.",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SlowAPIMiddleware)

@app.middleware("http")
async def secure_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

    return response

app.include_router(text.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(uploads.router)
app.include_router(feedback.router)

@app.get("/")
@limiter.limit("10/minute")
async def root(request: Request):
    return {"message": "SignFusion API is running gracefully."}
