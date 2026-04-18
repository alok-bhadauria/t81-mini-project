import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.core.config import settings
import cloudinary
from app.api.routes import text, auth, history, uploads, feedback
from app.core.exceptions import AppException
from fastapi.responses import JSONResponse
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
    db = get_database()

    await db["users"].create_index("email", unique=True, background=True)
    await db["users"].create_index("username", unique=True, background=True)
    await db["tasks"].create_index("user_id", background=True)
    await db["tasks"].create_index("created_at", background=True)
    await db["tasks"].create_index("input_type", background=True)
    
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

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )

app.add_middleware(RequestLoggingAndMaxBodySizeMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if isinstance(settings.cors_origins, list) else settings.cors_origins.split(","),
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

app.include_router(text.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(uploads.router)
app.include_router(feedback.router)

@app.get("/")
@limiter.limit("10/minute")
async def root(request: Request):
    return {"message": "SignFusion API is running gracefully."}

@app.get("/health")
async def health_check():
    try:
        db = get_database()
        await db.command("ping")
        return {"status": "ok"}
    except Exception:
        return {"status": "db_error"}
