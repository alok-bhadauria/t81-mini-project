import pytest
from app.services.b_gemini_translation_service import GeminiTranslationService
from app.services.c_ai_translation_service import AITranslationService
from app.core.exceptions import AppException

@pytest.mark.asyncio
async def test_gemini_service_validation():
    svc = GeminiTranslationService()
    
    valid_payload = {"asl_text": "HELLO ALOK", "tokens": ["HELLO", "ALOK"], "emotion": "HAPPY"}
    res = svc._validate(valid_payload)
    assert res.tokens == ["HELLO", "ALOK"]
    assert res.emotion == "HAPPY"

    mismatch_payload = {"asl_text": "HELLO ALOK", "tokens": ["ALOK", "HELLO"], "emotion": "HAPPY"}
    res = svc._validate(mismatch_payload)
    assert res.tokens == ["HELLO", "ALOK"]

    with pytest.raises(ValueError):
        svc._validate({"asl_text": "", "tokens": ["HELLO"], "emotion": "HAPPY"})

@pytest.mark.asyncio
async def test_ai_service_validation():
    svc = AITranslationService()
    mismatch_payload = {"asl_text": "HELLO ALOK", "tokens": ["ALOK", "HELLO"], "emotion": "HAPPY"}
    res = svc._validate(mismatch_payload)
    assert res.tokens == ["HELLO", "ALOK"]
