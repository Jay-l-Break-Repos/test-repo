import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { Document, DocumentApi } from '../services/document.api';

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = async (document: Document) => {
    setSelectedDocument(document);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDocument) return;

    try {
      await DocumentApi.deleteDocument(selectedDocument.id);
      
      // Update local state
      setDocuments(docs => docs.filter(d => d.id !== selectedDocument.id));
      
      // Close modal
      setIsDeleteModalOpen(false);
      setSelectedDocument(null);

      // If on document view page, redirect to list
      if (window.location.pathname.includes('/documents/')) {
        navigate('/documents');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Document list */}
      <div className="grid gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="border p-4 rounded flex justify-between items-center">
            <h3>{doc.title}</h3>
            <button
              onClick={() => handleDelete(doc)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDocument(null);
        }}
        onConfirm={handleConfirmDelete}
        documentTitle={selectedDocument?.title || ''}
      />
    </div>
  );
};