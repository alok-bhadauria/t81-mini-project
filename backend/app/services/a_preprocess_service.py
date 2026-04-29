import logging
import asyncio
from fastapi.concurrency import run_in_threadpool
from app.core.text_cleaner import clean_text

logger = logging.getLogger(__name__)


class PreprocessService:
    async def process(self, raw_text: str) -> str:
        result = await run_in_threadpool(clean_text, raw_text)
        logger.info("PreprocessService: Text cleaned and normalized.")
        return result
