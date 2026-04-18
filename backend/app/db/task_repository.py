import logging
from datetime import datetime
from app.models.task import TaskDBModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import AppException
import uuid

logger = logging.getLogger(__name__)

class TaskRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = self.db.get_collection("tasks")

    async def create_task(self, user_id: str, input_type: str, raw_text: str, processed_text: str, 
                          emotion_id: str, asl_grammar_output: str, sentiment_animation_id: str, 
                          gesture_animation_ids: list[str], animation_sequence: list[dict], 
                          file_metadata: dict = None) -> TaskDBModel:
        logger.info(f"TaskRepository: Inserting translation record for user {user_id}")
        try:
            custom_task_id = f"sfip{str(uuid.uuid4().int)[:10]}"
            task_data = TaskDBModel(
                user_id=user_id,
                task_id=custom_task_id,
                input_type=input_type,
                input_text=raw_text,
                processed_text=processed_text,
                emotion_id=emotion_id,
                asl_grammar_output=asl_grammar_output,
                sentiment_animation_id=sentiment_animation_id,
                gesture_animation_ids=gesture_animation_ids,
                animation_sequence=animation_sequence,
                file_metadata=file_metadata,
                created_at=datetime.utcnow()
            )
            
            task_dict = task_data.dict(by_alias=True, exclude={"id"})
            
            result = await self.collection.insert_one(task_dict)
            if not result.inserted_id:
                raise AppException("Failed to insert task record into MongoDB", status_code=500)
                
            task_data.id = result.inserted_id
            return task_data
        except Exception as e:
            logger.exception("TaskRepository Exception:")
            raise AppException(f"Database operation failed: {str(e)}", status_code=500) from e
