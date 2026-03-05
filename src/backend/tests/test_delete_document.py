"""
Unit tests for DELETE /api/documents/{document_id}

Uses an in-memory SQLite database and FastAPI's TestClient so no external
services (Postgres, Docker, etc.) are required.
"""

import os
import tempfile
import pytest

# ---------------------------------------------------------------------------
# Set DATABASE_URL *before* any app module is imported.
# database.py raises ValueError at module level if this env var is missing.
# ---------------------------------------------------------------------------
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

# ---------------------------------------------------------------------------
# App bootstrap — override the DB engine BEFORE importing the app so that
# database.py's module-level engine is replaced with the in-memory one.
# ---------------------------------------------------------------------------
import app.core.database as _db_module

# In-memory SQLite engine shared across all connections in the same thread
_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_db_module.engine = _test_engine  # patch before app is imported


def _override_get_session():
    """Dependency override: yield a session backed by the test engine."""
    with Session(_test_engine) as session:
        yield session


# Now it's safe to import the app (it will use the patched engine)
from app.main import app
from app.core.database import get_session
from app.models.document import Document

app.dependency_overrides[get_session] = _override_get_session


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_db():
    """Re-create all tables before each test and drop them after."""
    SQLModel.metadata.create_all(_test_engine)
    yield
    SQLModel.metadata.drop_all(_test_engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def tmp_file():
    """Create a real temporary file on disk so the delete endpoint can remove it."""
    fd, path = tempfile.mkstemp(suffix=".txt", prefix="test_doc_")
    os.write(fd, b"hello world")
    os.close(fd)
    yield path
    # Clean up if the test didn't delete it
    if os.path.exists(path):
        os.remove(path)


@pytest.fixture
def seeded_document(tmp_file):
    """Insert one Document row into the test DB and return it."""
    with Session(_test_engine) as session:
        doc = Document(
            name="test_document.txt",
            size=11,
            content_type="text/plain",
            path=tmp_file,
            owner_id=1,
            last_modified_by="tester",
            extracted_text="hello world",
        )
        session.add(doc)
        session.commit()
        session.refresh(doc)
        return doc


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestDeleteDocument:
    """Tests for DELETE /api/documents/{document_id}"""

    def test_delete_existing_document_returns_200(self, client, seeded_document):
        """Calling DELETE on a valid ID returns HTTP 200."""
        response = client.delete(f"/api/documents/{seeded_document.id}")
        assert response.status_code == 200

    def test_delete_existing_document_success_response(self, client, seeded_document):
        """Response body contains success=True and a descriptive message."""
        response = client.delete(f"/api/documents/{seeded_document.id}")
        body = response.json()
        assert body["success"] is True
        assert "permanently deleted" in body["message"].lower()
        assert seeded_document.name in body["message"]

    def test_delete_removes_record_from_database(self, client, seeded_document):
        """After deletion the document no longer exists in the DB."""
        doc_id = seeded_document.id
        client.delete(f"/api/documents/{doc_id}")

        with Session(_test_engine) as session:
            remaining = session.get(Document, doc_id)
        assert remaining is None, "Document should have been removed from the database"

    def test_delete_removes_file_from_disk(self, client, seeded_document, tmp_file):
        """After deletion the physical file is removed from disk."""
        assert os.path.exists(tmp_file), "Pre-condition: file must exist before deletion"
        client.delete(f"/api/documents/{seeded_document.id}")
        assert not os.path.exists(tmp_file), "Physical file should have been deleted from disk"

    def test_delete_nonexistent_document_returns_404(self, client):
        """Deleting a document that doesn't exist returns HTTP 404."""
        response = client.delete("/api/documents/99999")
        assert response.status_code == 404

    def test_delete_nonexistent_document_error_detail(self, client):
        """404 response body contains a meaningful detail message."""
        response = client.delete("/api/documents/99999")
        body = response.json()
        assert "detail" in body
        assert "not found" in body["detail"].lower()

    def test_delete_is_idempotent_second_call_returns_404(self, client, seeded_document):
        """Deleting the same document twice: first call succeeds, second returns 404."""
        first = client.delete(f"/api/documents/{seeded_document.id}")
        assert first.status_code == 200

        second = client.delete(f"/api/documents/{seeded_document.id}")
        assert second.status_code == 404

    def test_delete_missing_file_does_not_cause_500(self, client, seeded_document, tmp_file):
        """If the file is already gone from disk, the endpoint still succeeds (no 500)."""
        # Remove the file manually before calling the endpoint
        os.remove(tmp_file)
        assert not os.path.exists(tmp_file)

        response = client.delete(f"/api/documents/{seeded_document.id}")
        # Should still delete the DB record cleanly
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_delete_does_not_affect_other_documents(self, client, seeded_document):
        """Deleting one document leaves other documents untouched."""
        # Insert a second document (no real file needed for this check)
        with Session(_test_engine) as session:
            other = Document(
                name="other_document.txt",
                size=5,
                content_type="text/plain",
                path="/nonexistent/other.txt",
                owner_id=1,
            )
            session.add(other)
            session.commit()
            session.refresh(other)
            other_id = other.id

        # Delete only the first document
        client.delete(f"/api/documents/{seeded_document.id}")

        # The second document must still be present
        with Session(_test_engine) as session:
            still_there = session.get(Document, other_id)
        assert still_there is not None, "Unrelated document should not have been deleted"
