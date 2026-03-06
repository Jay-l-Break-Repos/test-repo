import os
import shutil
import logging
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.models import Document
from app.database import get_session, init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Ensure upload directory exists
UPLOAD_DIR = "/tmp/document_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session)
):
    # Validate file
    if not file.filename:
        logger.error("No file uploaded")
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Log file details
    logger.info(f"Uploading file: {file.filename}")
    
    try:
        # Create unique filename with timestamp to prevent overwrites
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create document record with full details
        document = Document(
            name=file.filename,  # Original filename
            size=os.path.getsize(file_path),
            content_type=file.content_type or "application/octet-stream",
            path=file_path,
            created_at=datetime.utcnow(),  # Explicit timestamp
            owner_id=None,  # Add user ID logic later
            last_modified_by=None
        )
        
        # Commit to database
        session.add(document)
        session.commit()
        session.refresh(document)
        
        logger.info(f"Document saved successfully: {document.name}")
        
        # Return document details
        return {
            "id": document.id,
            "name": document.name,
            "size": document.size,
            "content_type": document.content_type,
            "created_at": document.created_at.isoformat(),
            "path": document.path
        }
    
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("")
async def list_documents(
    session: Session = Depends(get_session)
):
    try:
        # Fetch all documents, most recent first
        documents = session.query(Document).order_by(Document.created_at.desc()).all()
        
        # Log documents for debugging
        logger.info(f"Fetched {len(documents)} documents")
        
        # Convert to list of dictionaries
        return [
            {
                "id": doc.id,
                "name": doc.name,
                "size": doc.size,
                "content_type": doc.content_type,
                "created_at": doc.created_at.isoformat(),
                "owner_id": doc.owner_id,
                "last_modified_by": doc.last_modified_by
            } for doc in documents
        ]
    
    except Exception as e:
        logger.error(f"Failed to fetch documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    session: Session = Depends(get_session)
):
    """
    Delete a document by ID.
    
    Args:
        document_id: The ID of the document to delete
        session: Database session
    
    Returns:
        200: Document successfully deleted
        404: Document not found
        500: Server error
    """
    try:
        # Find the document by ID
        document = session.query(Document).filter(Document.id == document_id).first()
        
        # Check if document exists
        if not document:
            logger.warning(f"Document not found with ID: {document_id}")
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        # Store file path for deletion
        file_path = document.path
        document_name = document.name
        
        # Delete the file from disk
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"File deleted from disk: {file_path}")
        else:
            logger.warning(f"File not found on disk: {file_path}")
        
        # Delete the document record from database
        session.delete(document)
        session.commit()
        
        logger.info(f"Document deleted successfully: {document_name} (ID: {document_id})")
        
        return {
            "message": f"Document '{document_name}' deleted successfully",
            "id": document_id
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions (404)
        raise
    
    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")