import asyncio
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def retry_async(max_retries: int = 3, delay: float = 1.0):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(1, max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    logger.warning(
                        f"Attempt {attempt}/{max_retries} failed for {func.__name__}: {e}. "
                        f"Retrying in {delay} seconds..."
                    )
                    if attempt < max_retries:
                        await asyncio.sleep(delay)
            
            logger.error(f"All {max_retries} attempts failed for {func.__name__}. Last error: {last_exception}")
            raise last_exception
        return wrapper
    return decorator
