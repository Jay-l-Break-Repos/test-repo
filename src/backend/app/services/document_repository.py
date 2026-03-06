"""
Document Repository
-------------------
Encapsulates all database access logic for the Document model.

This repository provides a clean separation between the data-access layer
and the API/business logic layer.  All direct SQLModel/SQLAlchemy queries
relating to documents live here so that:

* API route handlers stay thin and focused on HTTP concerns.
* The data-access logic is easy to unit-test in isolation.
* Future changes to the persistence strategy (e.g. switching ORM) are
  contained to this single module.

Soft-delete contract
~~~~~~~~~~~~~~~~~~~~
Documents are never physically removed from the database.  Instead, the
``deleted_at`` column is stamped with the current UTC timestamp.  A document
whose ``deleted_at`` is NULL is considered *active*; one with a non-NULL
value is considered *soft-deleted* and is excluded from normal queries.
"""

from datetime import datetime, timezone
from typing import List, Optional

from sqlmodel import Session, select

from app.models.document import Document


class DocumentRepository:
    """Data-access layer for :class:`~app.models.document.Document` records.

    All methods accept an open :class:`sqlmodel.Session` so that the caller
    (typically a FastAPI dependency) controls the transaction boundary.

    Example usage::

        with Session(engine) as session:
            repo = DocumentRepository(session)
            docs = repo.get_all_active()
            repo.soft_delete(doc_id=42)
    """

    def __init__(self, session: Session) -> None:
        """Initialise the repository with a database session.

        Args:
            session: An open SQLModel ``Session`` instance.  The repository
                does **not** own the session lifecycle — the caller is
                responsible for committing, rolling back, and closing it.
        """
        self._session = session

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_all_active(self) -> List[Document]:
        """Return all active (non-soft-deleted) documents, newest first.

        Documents whose ``deleted_at`` column is non-NULL are excluded.

        Returns:
            A list of :class:`~app.models.document.Document` instances
            ordered by ``id`` descending (most recently created first).
        """
        statement = (
            select(Document)
            .where(Document.deleted_at == None)  # noqa: E711 — SQLModel IS NULL syntax
            .order_by(Document.id.desc())
        )
        return list(self._session.exec(statement).all())

    def get_by_id(self, document_id: int) -> Optional[Document]:
        """Retrieve a single document by its primary key.

        Soft-deleted documents **are** returned by this method so that the
        caller can inspect the ``deleted_at`` field and decide how to handle
        them (e.g. return a 404 for already-deleted documents).

        Args:
            document_id: The primary key of the document to fetch.

        Returns:
            The :class:`~app.models.document.Document` instance, or ``None``
            if no row with that ID exists.
        """
        return self._session.get(Document, document_id)

    def get_active_by_id(self, document_id: int) -> Optional[Document]:
        """Retrieve a single *active* document by its primary key.

        Returns ``None`` if the document does not exist **or** has already
        been soft-deleted.

        Args:
            document_id: The primary key of the document to fetch.

        Returns:
            The :class:`~app.models.document.Document` instance if it exists
            and is active, otherwise ``None``.
        """
        document = self._session.get(Document, document_id)
        if document is None or document.deleted_at is not None:
            return None
        return document

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def soft_delete(self, document_id: int) -> Optional[Document]:
        """Permanently mark a document as deleted via soft-deletion.

        Sets the ``deleted_at`` timestamp to the current UTC time on the
        document row identified by *document_id*.  The row itself and the
        physical file on disk are **not** removed, preserving the ability to
        audit or restore the document later.

        The caller is responsible for calling ``session.commit()`` after this
        method returns if they want the change to be persisted.

        Args:
            document_id: The primary key of the document to soft-delete.

        Returns:
            The updated :class:`~app.models.document.Document` instance with
            ``deleted_at`` stamped, or ``None`` if no active document with
            the given ID was found (i.e. it does not exist or is already
            soft-deleted).
        """
        document = self.get_active_by_id(document_id)
        if document is None:
            return None

        document.deleted_at = datetime.now(timezone.utc)
        self._session.add(document)
        return document
