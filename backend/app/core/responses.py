from typing import Any, Optional
from fastapi.responses import JSONResponse

def success_response(message: str, data: Optional[Any] = None, status_code: int = 200) -> dict:
    return {
        "success": True,
        "message": message,
        "data": data or {},
        "errors": []
    }

def error_response(message: str, errors: Optional[list] = None, status_code: int = 400) -> JSONResponse:
    content = {
        "success": False,
        "message": message,
        "data": {},
        "errors": errors or []
    }
    return JSONResponse(status_code=status_code, content=content)
