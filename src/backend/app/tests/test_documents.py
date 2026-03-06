import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
import os
import tempfile

from app.main import app
from app.models.document import Document
from app.core.database import get_session

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create tables once at module load time
SQLModel.metadata.create_all(engine)

def override_get_session():
    with Session(engine) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session
client = TestClient(app)


def test_delete_document():
    """DELETE /api/documents/{id} should return 200, remove the DB record, and delete the file."""
    # Create a temporary file to simulate an uploaded document
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.write(b"Test content")
    temp_file.close()

    # Seed a document record in the test DB
    with Session(engine) as session:
        document = Document(
            name="test.txt",
            size=len("Test content"),
            content_type="text/plain",
            path=temp_file.name,
            owner_id=1
        )
        session.add(document)
        session.commit()
        session.refresh(document)
        document_id = document.id

    # Call the DELETE endpoint
    response = client.delete(f"/api/documents/{document_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == document_id
    assert data["message"] == "Document deleted successfully"

    # Verify the DB record is gone
    with Session(engine) as session:
        deleted_doc = session.get(Document, document_id)
        assert deleted_doc is None

    # Verify the file is removed from disk
    assert not os.path.exists(temp_file.name)


def test_delete_nonexistent_document():
    """DELETE /api/documents/{id} should return 404 when the document doesn't exist."""
    response = client.delete("/api/documents/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"
