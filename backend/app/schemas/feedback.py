from pydantic import BaseModel, Field
from datetime import datetime

class FeedbackCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=10, max_length=2000)

class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    message: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
