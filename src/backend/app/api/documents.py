from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Header, Response
from fastapi.responses import HTMLResponse
from datetime import datetime, timezone
from sqlmodel import Session, select, func
from app.core.database import get_session
from app.models.document import Document, DocumentRead
from app.services.storage import save_upload_file
import os

router = APIRouter()

@router.post("/upload", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    session: Session = Depends(get_session)
):
    try:
        filename = os.path.basename(file.filename).strip()
        if not filename:
            raise HTTPException(status_code=400, detail="Filename cannot be empty.")
        
        current_user = x_user_id or "Anonymous"
        
        # Check for existing document by name
        existing_doc = session.exec(
            select(Document).where(func.lower(Document.name) == func.lower(filename))
        ).first()
        
        file_path = save_upload_file(file)
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read().replace("\x00", "")

        if existing_doc:
            existing_doc.size = os.path.getsize(file_path)
            existing_doc.created_at = datetime.now(timezone.utc)
            existing_doc.last_modified_by = current_user
            existing_doc.extracted_text = content
            existing_doc.path = file_path
            db_doc = existing_doc
        else:
            db_doc = Document(
                name=filename,
                size=os.path.getsize(file_path),
                content_type=file.content_type,
                path=file_path,
                owner_id=1,
                last_modified_by=current_user,
                extracted_text=content
            )
        
        session.add(db_doc)
        session.commit()
        session.refresh(db_doc)
        
        # Ensure DocumentRead has versions
        return DocumentRead(**db_doc.dict(), versions=[])
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Keep minimal error logging
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[DocumentRead])
async def read_documents(
    session: Session = Depends(get_session)
):
    # Fetch only active (non-soft-deleted) documents, sorted by ID descending.
    # Documents with a non-NULL deleted_at are excluded from this listing.
    db_docs = session.exec(
        select(Document)
        .where(Document.deleted_at == None)  # noqa: E711 — SQLModel requires == None for IS NULL
        .order_by(Document.id.desc())
    ).all()
    return [DocumentRead(**doc.dict(), versions=[]) for doc in db_docs]

@router.get("/{document_id}")
async def get_document(document_id: int, session: Session = Depends(get_session)):
    document = session.get(Document, document_id)
    if not document or document.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentRead(**document.dict(), versions=[])

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    session: Session = Depends(get_session)
):
    """Soft-delete a document by ID.

    Sets the ``deleted_at`` timestamp on the document record to the current
    UTC time, marking it as deleted without removing the row from the
    database.  This allows the document to be restored later if needed.

    The physical file on disk is intentionally **not** removed so that the
    content remains recoverable.

    Args:
        document_id: Primary key of the document to soft-delete.
        session: SQLModel database session (injected by FastAPI).

    Returns:
        HTTP 200 with ``{"success": True, "message": "..."}`` on success.

    Raises:
        HTTPException 404: If no document with the given ID exists, or if
            it has already been soft-deleted.
    """
    document = session.get(Document, document_id)
    if not document or document.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Document not found")

    doc_name = document.name

    # Soft-delete: stamp the current UTC time instead of removing the row.
    document.deleted_at = datetime.now(timezone.utc)
    session.add(document)
    session.commit()

    return {
        "success": True,
        "message": f"Document '{doc_name}' has been permanently deleted.",
    }


@router.get("/{document_id}/view")
async def view_document(
    document_id: int,
    session: Session = Depends(get_session)
):
    document = session.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    with open(document.path, 'r', encoding='utf-8', errors='ignore') as f:
        text_content = f.read()
    
    return Response(content=text_content, media_type="text/plain")
