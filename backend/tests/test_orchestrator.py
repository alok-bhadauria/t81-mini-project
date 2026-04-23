import pytest
from unittest.mock import AsyncMock
from app.services.h_orchestrator import PipelineOrchestrator
from app.core.exceptions import AppException
from app.db.task_repository import TaskRepository

@pytest.mark.asyncio
async def test_orchestrator_empty_output_fails():
    repo_mock = AsyncMock(spec=TaskRepository)
    orchestrator = PipelineOrchestrator(repository=repo_mock)
    
    orchestrator._run_gemini_path = AsyncMock(return_value=("raw", "NEUTRAL", "", []))
    
    with pytest.raises(AppException) as excinfo:
        await orchestrator.run("hello", "user123", "TEXT")
    
    assert "empty output" in str(excinfo.value.message).lower()
