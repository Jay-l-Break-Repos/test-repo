import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { Document, DocumentApi } from '../services/document.api';

export const DocumentView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!document) return;

    try {
      await DocumentApi.deleteDocument(document.id);
      
      // Close modal and redirect to documents list
      setIsDeleteModalOpen(false);
      navigate('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  if (!document) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{document.title}</h1>
        <button
          onClick={handleDelete}
          className="px-4 py-2 text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>

      <div className="prose max-w-none">
        {document.content}
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        documentTitle={document.title}
      />
    </div>
  );
};