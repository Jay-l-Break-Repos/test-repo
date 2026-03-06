import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { type ApiDocument, getDocument, deleteDocument } from '../services/document.api';
import axios from 'axios';
import { showError } from '../utils/toast';


import './DocumentView.css';

export const DocumentView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<ApiDocument | null>(null);
    const [textContent, setTextContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteDoc, setDeleteDoc] = useState<{ name: string; id: number } | null>(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);


    useEffect(() => {
        const fetchDocument = async () => {
            if (!id) return;
            try {
                // Direct fetch using the new endpoint
                const doc = await getDocument(parseInt(id));
                setDocument(doc);
            } catch (error) {
                showError('Failed to load document');
                console.error(error);
                navigate('/documents');
            } finally {
                setLoading(false);
            }
        };
        fetchDocument();
    }, [id, navigate]);

    useEffect(() => {
        const fetchContent = async () => {
            if (!document) return;

            const isTxtFile = document.name.toLowerCase().endsWith('.txt');

            if (isTxtFile) {
                try {
                    const response = await axios.get(`/api/documents/${document.id}/view`, {
                        params: { raw: true },
                        responseType: 'text'
                    });
                    setTextContent(response.data);
                } catch (e) {
                    console.error('Failed to fetch text content:', e);
                    setTextContent('Failed to load content.');
                }
            }
        };
        fetchContent();
    }, [document]);

    const handleDelete = async (docId: number) => {
        try {
            await deleteDocument(docId);
            setDeleteDoc(null);
            setDeleteSuccess(true);
            navigate('/documents');
        } catch (error) {
            console.error('Delete failed:', error);
            showError('Failed to delete document');
        }
    };

    if (loading || !document) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <FileText size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading document...</p>
                </div>
            </div>
        );
    }

    // Helper to get file icon based on type
    const getFileIcon = () => {
        return <FileText size={24} color="#64748b" strokeWidth={1.5} />;
    };


    const renderContent = () => {
        const isTxtFile = document.name.toLowerCase().endsWith('.txt');

        if (isTxtFile) {
            return (
                <div className="document-text-content">
                    {textContent || 'Loading content...'}
                </div>
            );
        }

        return (
            <div className="document-preview-placeholder">
                <FileText size={64} style={{ color: 'var(--text-secondary)' }} />
                <h3>Preview not available</h3>
                <p style={{ color: 'var(--text-secondary)' }}>This file type cannot be previewed in the browser.</p>
            </div>
        );
    };

    return (
        <div className="document-view-container">
            <div className="document-view-content">
                {/* Unified Card Container */}
                <div className="document-card">
                    {/* Header Section */}
                    <div className="document-header">
                        {/* Left Section: Back + File Info */}
                        <div className="document-header-left">
                            {/* Back Button */}
                            <button
                                onClick={() => navigate('/documents')}
                                className="back-button"
                                title="Back to Documents"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            {/* Divider */}
                            <div className="file-info-divider" />

                            {/* File Icon */}
                            <div className="file-icon-wrapper">
                                {getFileIcon()}
                            </div>

                            {/* Filename */}
                            {document && (
                                <span className="document-filename">
                                    {document.name}
                                </span>
                            )}

                            {/* File Size */}
                            {document?.size && (
                                <span className="document-filesize">
                                    {(document.size / 1024).toFixed(1)} KB
                                </span>
                            )}
                        </div>

                        {/* Action Buttons Container */}
                        <div className="document-actions">
                            <button
                                title="Delete Document"
                                className="delete-document-button"
                                onClick={() => {
                                    setDeleteDoc({ name: document.name, id: document.id });
                                }}
                            >
                                🗑️ Delete Document
                            </button>
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="document-scroll-area">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold mb-2">Delete Document</h3>
                        <p className="mb-4">Are you sure you want to delete "{deleteDoc.name}"?</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleDelete(deleteDoc.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                            <button 
                                onClick={() => setDeleteDoc(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {deleteSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Document deleted successfully
                </div>
            )}
        </div>
    );
};
