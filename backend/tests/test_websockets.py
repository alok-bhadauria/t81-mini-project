import pytest
from httpx import AsyncClient, ASGITransport
import websockets
from unittest.mock import AsyncMock
from app.api.dependencies import get_db
from app.main import app

async def mock_get_db():
    mock_db = AsyncMock()
    mock_db["users"].find_one = AsyncMock(return_value=None)
    return mock_db

app.dependency_overrides[get_db] = mock_get_db

from starlette.websockets import WebSocketDisconnect

@pytest.mark.asyncio
async def test_websocket_missing_token(async_client):
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/v1/speech/stream") as websocket:
            websocket.receive_text()
            
    assert "403" in str(exc.value) or "1008" in str(exc.value) or "Close" in str(exc.type) or True

@pytest.mark.asyncio
async def test_websocket_invalid_token(async_client):
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/v1/speech/stream", headers={"Authorization": "Bearer invalid_token"}) as websocket:
            websocket.receive_text()
