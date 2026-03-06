import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.document import Document
from app.core.database import get_db, Base, engine

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
    """Create a test document in the database"""
    db = next(get_db())
    document = Document(
        name="test_document.pdf",
        size=1024,
        content_type="application/pdf",
        path="/uploads/test_document.pdf",
        owner_id=1
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    yield document
    # Clean up
    db.delete(document)
    db.commit()

def test_delete_document_success(client, test_document):
    """Test successful document deletion"""
    # Delete the document
    response = client.delete(f"/api/documents/{test_document.id}")
    
    # Verify response
    assert response.status_code == 204
    
    # Verify document is actually deleted from database
    db = next(get_db())
    deleted_document = db.query(Document).filter(Document.id == test_document.id).first()
    assert deleted_document is None

def test_delete_document_not_found(client):
    """Test deletion of non-existent document"""
    # Try to delete a document that doesn't exist
    response = client.delete("/api/documents/999999")
    
    # Verify response
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_delete_document_invalid_id(client):
    """Test deletion with invalid document ID format"""
    # Try to delete with invalid ID (non-integer)
    response = client.delete("/api/documents/invalid-id")
    
    # Verify response
    assert response.status_code == 404  # FastAPI will return 404 for invalid path parameters
    
    # Note: In a real implementation, you might want to validate the ID format
    # before querying the database, but FastAPI's path parameter validation
    # will handle this automatically if the path parameter is defined as int
    # Since our model uses int primary key, FastAPI will return 404 for non-integer IDs"""