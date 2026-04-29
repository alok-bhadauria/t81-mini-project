import logging
from app.core.logging_config import setup_logging, request_id_var

setup_logging()

from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.core.config import settings
import cloudinary
from app.api.routes import text, auth, history, uploads, feedback, speech, admin
from app.core.exceptions import AppException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from app.core.responses import error_response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.rate_limit import limiter
import uuid
import time
import logging

logger = logging.getLogger(__name__)

class RequestLoggingAndMaxBodySizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = str(uuid.uuid4())
        request.state.request_id = req_id
        request_id_var.set(req_id)
        logger.info(f"Request started: {req_id} - {request.method} {request.url.path}")
        start_time = time.time()
        
        if "content-length" in request.headers:
            try:
                content_length = int(request.headers["content-length"])
                if content_length > 10 * 1024 * 1024:
                    logger.warning(f"Request {req_id} rejected: Payload Too Large ({content_length} bytes)")
                    return JSONResponse(status_code=413, content={"detail": "Payload Too Large"})
            except ValueError:
                pass
                
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        
        process_time = time.time() - start_time
        logger.info(f"Request finished: {req_id} - Status {response.status_code} in {process_time:.4f}s")
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()

    from app.core.nlp_loader import nlp
    if nlp is None:
        raise RuntimeError("SpaCy model 'en_core_web_sm' not found. Run: python -m spacy download en_core_web_sm")

    db = get_database()

    await db["users"].create_index("email", unique=True, background=True)
    await db["users"].create_index("username", unique=True, background=True)
    await db["tasks"].create_index("user_id", background=True)
    await db["tasks"].create_index("created_at", background=True)
    await db["tasks"].create_index("input_type", background=True)
    await db["tasks"].create_index(
        [("user_id", 1), ("created_at", -1)], background=True
    )
    
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True
    )

    from app.services.f_animation_service import AnimationService
    from app.services.c_ai_translation_service import AITranslationService
    from app.services.b_gemini_translation_service import GeminiTranslationService
    animation_svc = AnimationService()
    AITranslationService().load_gesture_vocabulary(animation_svc.get_gesture_map())
    GeminiTranslationService()

    yield
    await close_mongo_connection()


tags_metadata = [
    {"name": "auth", "description": "Operations with users and authentication. The **login** logic is also here."},
    {"name": "text", "description": "Manage AI translation for text inputs."},
    {"name": "speech", "description": "Manage AI translation for live speech inputs over WebSocket."},
    {"name": "history", "description": "Manage user history data."},
    {"name": "uploads", "description": "Manage user document uploads."},
    {"name": "Feedback", "description": "Submit user feedback and support tickets."},
    {"name": "admin", "description": "Administrative endpoints requiring elevated permissions."}
]

app = FastAPI(
    title="SignFusion Backend API",
    description="Scalable backend for handling multimodal Sign Language translation requests.",
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=tags_metadata
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return error_response(message=exc.message, errors=exc.errors, status_code=exc.status_code)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [{"loc": e["loc"], "msg": e["msg"]} for e in exc.errors()]
    return error_response(message="Validation Error", errors=errors, status_code=422)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return error_response(message=str(exc.detail), status_code=exc.status_code)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return error_response(message="Internal Server Error", status_code=500)

app.add_middleware(RequestLoggingAndMaxBodySizeMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if isinstance(settings.cors_origins, list) else settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

app.add_middleware(SlowAPIMiddleware)

@app.middleware("http")
async def secure_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' https://www.googleapis.com https://res.cloudinary.com"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
    return response

app.include_router(text.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(uploads.router)
app.include_router(feedback.router)
app.include_router(speech.router)
app.include_router(admin.router)

from app.core.responses import success_response, error_response

@app.get("/")
@limiter.limit("10/minute")
async def root(request: Request):
    return success_response(message="SignFusion API is running gracefully.")

@app.get("/health")
async def health_check():
    try:
        db = get_database()
        await db.command("ping")
        return success_response(message="ok")
    except Exception:
        return error_response(message="db_error", status_code=503)
