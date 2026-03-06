from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Document(BaseModel):
    id: str = Field(..., description="Document unique identifier")
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Document content")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None