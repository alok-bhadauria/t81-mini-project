import asyncio
import logging
import time
from typing import Annotated
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
import json

from app.api.dependencies import get_db, oauth2_scheme, get_current_user, get_orchestrator
from app.services.h_orchestrator import PipelineOrchestrator
from app.db.task_repository import TaskRepository
from jose import jwt, JWTError
from app.core.config import settings
from bson import ObjectId
from bson.errors import InvalidId
from app.models.user import UserDBModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/speech", tags=["speech"])

async def get_user_from_token(token: str, db: AsyncIOMotorDatabase) -> UserDBModel | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            return None
        obj_id = ObjectId(user_id)
        user_doc = await db["users"].find_one({"_id": obj_id})
        if user_doc:
            return UserDBModel(**user_doc)
    except (JWTError, InvalidId):
        return None
    return None

@router.websocket("/stream")
async def websocket_speech_endpoint(
    websocket: WebSocket,
    db: AsyncIOMotorDatabase = Depends(get_db),
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
):
    auth_header = websocket.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        await websocket.close(code=1008, reason="Authentication failed: Missing or invalid Authorization header")
        return
        
    token = auth_header.split(" ")[1]
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008, reason="Authentication failed")
        return

    await websocket.accept()
    await websocket.send_json({"status": "authenticated"})

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                text_chunk = payload.get("text", "").strip()
                is_final = payload.get("is_final", False)
                
                if not text_chunk:
                    continue

                try:
                    result, persist_kwargs = await asyncio.wait_for(
                        orchestrator.run(
                            raw_text=text_chunk,
                            user_id=str(user.id),
                            input_type="SPEECH",
                            file_metadata={"is_final": is_final}
                        ),
                        timeout=25.0
                    )
                    
                    asyncio.create_task(orchestrator._persist_task(**persist_kwargs))
                    
                    response_data = {
                        "type": "final" if is_final else "partial",
                        "processed_text": result.processed_text,
                        "asl_grammar_output": result.asl_grammar_output,
                        "sentiment_animation_id": result.sentiment_animation_id,
                        "gesture_animation_ids": result.gesture_animation_ids,
                        "animation_sequence": result.animation_sequence,
                    }
                    await websocket.send_json(response_data)
                except asyncio.TimeoutError:
                    await websocket.send_json({"type": "error", "message": "Translation timed out"})
                except Exception as e:
                    logger.warning(f"WebSocket translation error: {e}")
                    await websocket.send_json({"type": "error", "message": str(e)})

            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON payload"})
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user.id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
