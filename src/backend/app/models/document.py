from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

class DocumentBase(SQLModel):
    name: str = Field(index=True)
    size: int
    content_type: str
    path: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner_id: int = Field(default=1) # Mock User ID
    last_modified_by: Optional[str] = Field(default="Anonymous")
    extracted_text: Optional[str] = Field(default=None)
    # Soft-deletion timestamp. NULL means the document is active;
    # a non-NULL value means the document has been soft-deleted.
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)

class Document(DocumentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class DocumentRead(DocumentBase):
    id: int
    versions: List[dict] = []


class DocumentDeleteResponse(SQLModel):
    """Response model returned by DELETE /api/documents/{id}."""

    success: bool
    message: str


# Pagination response model removed
