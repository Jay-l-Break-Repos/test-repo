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

def override_get_session():
    with Session(engine) as session:
        yield session

# Create tables once before running tests
SQLModel.metadata.create_all(engine)

app.dependency_overrides[get_session] = override_get_session
client = TestClient(app)

def test_delete_document():
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.write(b"Test content")
    temp_file.close()
    
    # Create a test document in the database
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
    
    # Test deleting the document
    response = client.delete(f"/api/documents/{document_id}")
    assert response.status_code == 200
    
    # Verify document is deleted from database
    with Session(engine) as session:
        deleted_doc = session.get(Document, document_id)
        assert deleted_doc is None
    
    # Verify file is deleted from disk
    assert not os.path.exists(temp_file.name)

def test_delete_nonexistent_document():
    response = client.delete("/api/documents/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"