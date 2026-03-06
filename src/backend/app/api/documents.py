from fastapi import APIRouter, HTTPException, status
from typing import Dict
from app.models.document import Document
from app.core.database import get_db

router = APIRouter()

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str) -> Dict:
    """
    Permanently delete a document from the database.
    
    Args:
        document_id (str): The unique identifier of the document to delete
        
    Returns:
        Dict: Empty response with 204 status code on success
        
    Raises:
        HTTPException: 404 if document not found, 500 if deletion fails
    """
    db = get_db()
    
    # Find the document
    document = db.query(Document).filter(Document.id == document_id).first()
    
    # If document doesn't exist, return 404
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Document with ID {document_id} not found"
        )
    
    # Permanently delete the document from database
    try:
        db.delete(document)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to delete document: {str(e)}"
        )
    
    # Return 204 No Content as per REST standards for successful deletion
    return {}