import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.document import Document
from app.core.database import get_db, Base, engine
import os
import tempfile

# Create test database
@pytest.fixture(scope="module")
def test_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables after tests
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture(scope="module")
def test_document():
    """Create a test document in the database with a temporary file"""
    db = next(get_db())
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
        f.write(b'Test document content')
        temp_file_path = f.name
    
    document = Document(
        name="test_document.pdf",
        size=20,
        content_type="application/pdf",
        path=temp_file_path,
        owner_id=1
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Verify file exists
    assert os.path.exists(temp_file_path)
    
    yield document
    
    # Clean up
    if os.path.exists(temp_file_path):
        os.unlink(temp_file_path)
    db.delete(document)
    db.commit()

def test_delete_document_success(client, test_document):
    """Test successful document deletion"""
    # Verify document exists before deletion
    db = next(get_db())
    document = db.query(Document).filter(Document.id == test_document.id).first()
    assert document is not None
    
    # Delete the document
    response = client.delete(f"/api/documents/{test_document.id}")
    
    # Verify response
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["success"] is True
    assert f"Document '{test_document.name}' has been permanently deleted." in response_json["message"]
    
    # Verify document is actually deleted from database
    deleted_document = db.query(Document).filter(Document.id == test_document.id).first()
    assert deleted_document is None
    
    # Verify file was deleted from disk
    assert not os.path.exists(test_document.path)

def test_delete_document_not_found(client):
    """Test deletion of non-existent document"""
    # Try to delete a document that doesn't exist
    response = client.delete("/api/documents/999999")
    
    # Verify response
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"

def test_delete_document_invalid_id(client):
    """Test deletion with invalid document ID format"""
    # Try to delete with invalid ID (non-integer)
    response = client.delete("/api/documents/invalid-id")
    
    # Verify response - FastAPI will return 404 for invalid path parameters
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"