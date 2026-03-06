import os
import shutil
import logging
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .models import Document
from .database import get_session, init_db

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
    
    # Create unique filename
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create document record
    document = Document(
        name=file.filename,
        size=os.path.getsize(file_path),
        content_type=file.content_type or "application/octet-stream",
        path=file_path,
        owner_id=None,  # Add user ID logic later
        last_modified_by=None
    )
    
    session.add(document)
    session.commit()
    session.refresh(document)
    
    logger.info(f"Document saved: {document.to_dict()}")
    return document.to_dict()

@router.get("")
async def list_documents(
    session: Session = Depends(get_session)
):
    documents = session.query(Document).all()
    
    # Log documents for debugging
    logger.info(f"Fetched {len(documents)} documents")
    for doc in documents:
        logger.info(f"Document: {doc.to_dict()}")
    
    return [doc.to_dict() for doc in documents]