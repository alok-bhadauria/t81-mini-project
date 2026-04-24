from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None


db = Database()


async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.mongodb_uri)
        await db.client.admin.command("ping")
        logger.info("Successfully connected to MongoDB.")
    except Exception:
        logger.exception("FATAL: Failed to connect to MongoDB.")
        raise RuntimeError("MongoDB connection failed. Cannot start application.")


async def close_mongo_connection():
    if db.client:
        db.client.close()


def get_database():
    return db.client.signfusion
