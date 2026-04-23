from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    env: str = "production"
    debug: bool = False
    log_level: str = "INFO"
    mongodb_uri: str
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    cloudinary_url: str
    google_client_id: str
    google_client_secret: str
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    cors_origins: str | list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    groq_api_key: str
    gemini_api_key: str = ""
    llm_model: str = "llama-3.3-70b-versatile"
    gemini_model: str = "gemini-2.0-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
