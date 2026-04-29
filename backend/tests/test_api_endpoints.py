import pytest
from unittest.mock import AsyncMock
from app.main import app
from app.api.dependencies import get_db

async def mock_get_db():
    mock_db = AsyncMock()
    mock_db["users"].find_one = AsyncMock(return_value=None)
    return mock_db

app.dependency_overrides[get_db] = mock_get_db

@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/health")
    assert response.status_code in [200, 503]
    assert response.json()["message"] in ["ok", "db_error"]

@pytest.mark.asyncio
async def test_check_username(async_client):
    response = await async_client.get("/api/v1/auth/check-username?username=test1234")
    assert response.status_code == 200
    assert "available" in response.json()["data"]

@pytest.mark.asyncio
async def test_unauthorized_text_translation(async_client):
    payload = {"text": "hello", "type": "TEXT"}
    response = await async_client.post("/api/v1/text", json=payload)
    assert response.status_code == 401
