from fastapi import APIRouter, HTTPException, status
from typing import Dict

router = APIRouter()

# In-memory storage for documents (in a real app, this would be a database)
documents: Dict[str, dict] = {}

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document by its ID.
    
    Args:
        document_id: The unique identifier of the document to delete
        
    Returns:
        A success message if the document was deleted
        
    Raises:
        404: If the document is not found
    """
    if document_id not in documents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found"
        )
    
    del documents[document_id]
    return {"message": "Document deleted successfully"}