from pydantic_settings import BaseSettings

class Settings(BaseSettings):
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

    class Config:
        env_file = ".env"

settings = Settings()
