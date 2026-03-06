import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.models.document import Document
from app.core.database import get_session


# ---------------------------------------------------------------------------
# In-memory SQLite engine used only for tests
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def override_get_session():
    """Dependency override: yield a session backed by the in-memory DB."""
    with Session(test_engine) as session:
        yield session


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Create all tables once for the test module, then drop them."""
    SQLModel.metadata.create_all(test_engine)
    yield
    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture(scope="module")
def client():
    """TestClient with the get_session dependency overridden."""
    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def test_document(client):
    """
    Create a real temporary file and a matching Document row, then clean up
    after each test that uses this fixture.
    """
    # Create a temporary file on disk so the endpoint can delete it
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
    tmp.write(b"Test document content")
    tmp.close()

    with Session(test_engine) as session:
        doc = Document(
            name="test_document.txt",
            size=21,
            content_type="text/plain",
            path=tmp.name,
            owner_id=1,
        )
        session.add(doc)
        session.commit()
        session.refresh(doc)
        doc_id = doc.id
        doc_name = doc.name
        doc_path = doc.path

    yield {"id": doc_id, "name": doc_name, "path": doc_path}

    # Teardown: remove leftover file and DB row if they still exist
    if os.path.exists(tmp.name):
        os.unlink(tmp.name)
    with Session(test_engine) as session:
        leftover = session.get(Document, doc_id)
        if leftover:
            session.delete(leftover)
            session.commit()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_delete_document_success(client, test_document):
    """DELETE /api/documents/{id} removes the record and the file."""
    doc_id = test_document["id"]
    doc_name = test_document["name"]
    doc_path = test_document["path"]

    # Confirm the document exists before deletion
    with Session(test_engine) as session:
        assert session.get(Document, doc_id) is not None

    response = client.delete(f"/api/documents/{doc_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert doc_name in body["message"]

    # Confirm the DB record is gone
    with Session(test_engine) as session:
        assert session.get(Document, doc_id) is None

    # Confirm the physical file is gone
    assert not os.path.exists(doc_path)


def test_delete_document_not_found(client):
    """DELETE /api/documents/{id} returns 404 for a non-existent document."""
    response = client.delete("/api/documents/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


def test_delete_document_invalid_id(client):
    """DELETE /api/documents/{id} returns 422 for a non-integer ID."""
    response = client.delete("/api/documents/not-an-integer")

    # FastAPI validates path parameters; a non-integer int param → 422
    assert response.status_code == 422
