"""
Unit tests for document deletion — covering both the DocumentRepository
service layer and the DELETE /api/documents/{document_id} HTTP endpoint.

Architecture under test
-----------------------
* ``DocumentRepository`` — data-access layer (soft-delete logic lives here).
* ``DELETE /api/documents/{id}`` — HTTP endpoint that delegates to the repo.

Uses an in-memory SQLite database and FastAPI's TestClient so no external
services (Postgres, Docker, etc.) are required.

Soft-delete contract
--------------------
* The document row is **not** removed from the database; instead its
  ``deleted_at`` column is stamped with the current UTC timestamp.
* The physical file on disk is **not** removed.
* A soft-deleted document is excluded from GET /api/documents (the list
  endpoint) and returns 404 on a subsequent DELETE call.
"""

import os
import tempfile
import pytest

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine, select
from sqlmodel.pool import StaticPool

# ---------------------------------------------------------------------------
# App bootstrap — override the DB engine BEFORE importing the app so that
# database.py's module-level engine is replaced with the in-memory one.
# ---------------------------------------------------------------------------

# Set DATABASE_URL before importing any app modules that read it at module level.
import os as _os
_os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

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
from app.services.document_repository import DocumentRepository

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


@pytest.fixture
def db_session():
    """Provide a raw SQLModel session for repository-level tests."""
    with Session(_test_engine) as session:
        yield session


# ---------------------------------------------------------------------------
# Repository unit tests
# ---------------------------------------------------------------------------

class TestDocumentRepository:
    """Direct unit tests for DocumentRepository — no HTTP layer involved."""

    def test_get_all_active_returns_only_active_documents(self, db_session, seeded_document):
        """get_all_active() excludes soft-deleted documents."""
        repo = DocumentRepository(db_session)
        active_ids = [d.id for d in repo.get_all_active()]
        assert seeded_document.id in active_ids

    def test_get_all_active_excludes_soft_deleted(self, db_session, seeded_document):
        """get_all_active() does not return documents with a non-NULL deleted_at."""
        repo = DocumentRepository(db_session)
        repo.soft_delete(seeded_document.id)
        db_session.commit()

        active_ids = [d.id for d in repo.get_all_active()]
        assert seeded_document.id not in active_ids

    def test_get_by_id_returns_document(self, db_session, seeded_document):
        """get_by_id() returns the document regardless of soft-delete status."""
        repo = DocumentRepository(db_session)
        doc = repo.get_by_id(seeded_document.id)
        assert doc is not None
        assert doc.id == seeded_document.id

    def test_get_by_id_returns_none_for_missing(self, db_session):
        """get_by_id() returns None when no document has the given ID."""
        repo = DocumentRepository(db_session)
        assert repo.get_by_id(99999) is None

    def test_get_by_id_returns_soft_deleted_document(self, db_session, seeded_document):
        """get_by_id() still returns a soft-deleted document (caller decides what to do)."""
        repo = DocumentRepository(db_session)
        repo.soft_delete(seeded_document.id)
        db_session.commit()

        doc = repo.get_by_id(seeded_document.id)
        assert doc is not None
        assert doc.deleted_at is not None

    def test_get_active_by_id_returns_active_document(self, db_session, seeded_document):
        """get_active_by_id() returns the document when it is active."""
        repo = DocumentRepository(db_session)
        doc = repo.get_active_by_id(seeded_document.id)
        assert doc is not None
        assert doc.id == seeded_document.id

    def test_get_active_by_id_returns_none_for_soft_deleted(self, db_session, seeded_document):
        """get_active_by_id() returns None after the document is soft-deleted."""
        repo = DocumentRepository(db_session)
        repo.soft_delete(seeded_document.id)
        db_session.commit()

        assert repo.get_active_by_id(seeded_document.id) is None

    def test_get_active_by_id_returns_none_for_missing(self, db_session):
        """get_active_by_id() returns None when no document has the given ID."""
        repo = DocumentRepository(db_session)
        assert repo.get_active_by_id(99999) is None

    def test_soft_delete_stamps_deleted_at(self, db_session, seeded_document):
        """soft_delete() sets deleted_at to a non-NULL UTC timestamp."""
        repo = DocumentRepository(db_session)
        updated = repo.soft_delete(seeded_document.id)
        db_session.commit()

        assert updated is not None
        assert updated.deleted_at is not None

    def test_soft_delete_does_not_remove_row(self, db_session, seeded_document):
        """soft_delete() leaves the database row intact."""
        repo = DocumentRepository(db_session)
        repo.soft_delete(seeded_document.id)
        db_session.commit()

        row = db_session.get(Document, seeded_document.id)
        assert row is not None, "Row must still exist after soft_delete()"

    def test_soft_delete_returns_none_for_missing_id(self, db_session):
        """soft_delete() returns None when the document ID does not exist."""
        repo = DocumentRepository(db_session)
        result = repo.soft_delete(99999)
        assert result is None

    def test_soft_delete_returns_none_for_already_deleted(self, db_session, seeded_document):
        """soft_delete() returns None when the document is already soft-deleted."""
        repo = DocumentRepository(db_session)
        repo.soft_delete(seeded_document.id)
        db_session.commit()

        second = repo.soft_delete(seeded_document.id)
        assert second is None

    def test_soft_delete_does_not_affect_other_documents(self, db_session, seeded_document):
        """soft_delete() only marks the targeted document; others remain active."""
        with Session(_test_engine) as s2:
            other = Document(
                name="other.txt",
                size=5,
                content_type="text/plain",
                path="/nonexistent/other.txt",
                owner_id=1,
            )
            s2.add(other)
            s2.commit()
            s2.refresh(other)
            other_id = other.id

        repo = DocumentRepository(db_session)
        repo.soft_delete(seeded_document.id)
        db_session.commit()

        still_active = db_session.get(Document, other_id)
        assert still_active is not None
        assert still_active.deleted_at is None


# ---------------------------------------------------------------------------
# HTTP endpoint integration tests
# ---------------------------------------------------------------------------

class TestDeleteDocument:
    """Tests for DELETE /api/documents/{document_id} (soft-delete via HTTP)."""

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

    def test_delete_stamps_deleted_at_in_database(self, client, seeded_document):
        """After soft-deletion the row still exists but deleted_at is set."""
        doc_id = seeded_document.id
        client.delete(f"/api/documents/{doc_id}")

        with Session(_test_engine) as session:
            row = session.get(Document, doc_id)

        assert row is not None, "Row must still exist after soft-delete"
        assert row.deleted_at is not None, "deleted_at must be stamped after soft-delete"

    def test_delete_does_not_remove_record_from_database(self, client, seeded_document):
        """After soft-deletion the document row is still present in the DB."""
        doc_id = seeded_document.id
        client.delete(f"/api/documents/{doc_id}")

        with Session(_test_engine) as session:
            remaining = session.get(Document, doc_id)
        assert remaining is not None, "Document row should NOT be removed from the database"

    def test_delete_does_not_remove_file_from_disk(self, client, seeded_document, tmp_file):
        """After soft-deletion the physical file is still present on disk."""
        assert os.path.exists(tmp_file), "Pre-condition: file must exist before deletion"
        client.delete(f"/api/documents/{seeded_document.id}")
        assert os.path.exists(tmp_file), "Physical file should NOT be deleted from disk on soft-delete"

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

    def test_soft_deleted_document_excluded_from_list(self, client, seeded_document):
        """A soft-deleted document must not appear in GET /api/documents."""
        # Confirm it appears before deletion
        before = client.get("/api/documents")
        ids_before = [d["id"] for d in before.json()]
        assert seeded_document.id in ids_before

        # Soft-delete it
        client.delete(f"/api/documents/{seeded_document.id}")

        # Must no longer appear in the list
        after = client.get("/api/documents")
        ids_after = [d["id"] for d in after.json()]
        assert seeded_document.id not in ids_after, (
            "Soft-deleted document should be excluded from the document list"
        )

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

        # Soft-delete only the first document
        client.delete(f"/api/documents/{seeded_document.id}")

        # The second document must still be present and active
        with Session(_test_engine) as session:
            still_there = session.get(Document, other_id)
        assert still_there is not None, "Unrelated document should not have been deleted"
        assert still_there.deleted_at is None, "Unrelated document should not be soft-deleted"
