import os
import shutil
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .models import Document
from .database import get_session, init_db

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
        raise HTTPException(status_code=400, detail="No file uploaded")
    
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
    
    return document.to_dict()

@router.get("")
async def list_documents(
    session: Session = Depends(get_session)
):
    documents = session.query(Document).all()
    return [doc.to_dict() for doc in documents]

@router.get("/{document_id}")
async def get_document(
    document_id: int,
    session: Session = Depends(get_session)
):
    document = session.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document.to_dict()

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    session: Session = Depends(get_session)
):
    document = session.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove file from disk
    try:
        if os.path.exists(document.path):
            os.remove(document.path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")
    
    # Remove from database
    session.delete(document)
    session.commit()
    
    return {"message": "Document deleted successfully"}

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
    
    return {"content": text_content}