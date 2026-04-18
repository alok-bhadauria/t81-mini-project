from motor.motor_asyncio import AsyncIOMotorClient
import sys
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.mongodb_uri)
        await db.client.admin.command('ping')
        logger.info("Successfully connected to core MongoDB clusters.")
    except Exception:
        logger.exception("FATAL: Failed to connect to MongoDB cluster:")
        sys.exit(1)

async def close_mongo_connection():
    if db.client:
        db.client.close()

def get_database():
    return db.client.signfusion
