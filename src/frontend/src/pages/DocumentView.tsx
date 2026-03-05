import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { type ApiDocument, getDocument, deleteDocument } from '../services/document.api';
import axios from 'axios';
import { showError, showSuccess } from '../utils/toast';

import './DocumentView.css';

export const DocumentView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<ApiDocument | null>(null);
    const [textContent, setTextContent] = useState("");
    const [loading, setLoading] = useState(true);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchDocument = async () => {
            if (!id) return;
            try {
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

    // Confirm deletion: soft-delete via API then navigate back to list
    const handleDeleteConfirm = async () => {
        if (!document) return;
        setDeleting(true);
        try {
            await deleteDocument(document.id);
            showSuccess('Document has been permanently deleted.');
            setShowDeleteModal(false);
            navigate('/documents');
        } catch (error) {
            console.error('Failed to delete document:', error);
            showError('Failed to delete document. Please try again.');
        } finally {
            setDeleting(false);
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
        <>
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
                                {/* Delete Document button */}
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    title="Delete Document"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.4rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#9ca3af',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#e11d48')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="document-scroll-area">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delete confirmation modal ── */}
            {showDeleteModal && document && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    style={{
                        position: 'fixed', inset: 0, zIndex: 50,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => !deleting && setShowDeleteModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dv-delete-modal-title"
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                        style={{
                            background: 'white', borderRadius: '1rem',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                            width: '100%', maxWidth: '28rem', margin: '0 1rem', overflow: 'hidden',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f3f4f6',
                        }}>
                            <div style={{ padding: '0.5rem', background: '#fff1f2', borderRadius: '0.75rem' }}>
                                <AlertTriangle size={22} color="#f43f5e" />
                            </div>
                            <h2
                                id="dv-delete-modal-title"
                                style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}
                            >
                                Delete Document
                            </h2>
                        </div>

                        {/* Modal body */}
                        <div style={{ padding: '1.25rem 1.5rem' }}>
                            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                                Are you sure you want to permanently delete this document? This action cannot be undone.
                            </p>

                            {/* Document preview */}
                            <div style={{ borderRadius: '0.75rem', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        <tr style={{ background: '#f9fafb' }}>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        padding: '0.375rem', background: 'white',
                                                        borderRadius: '0.5rem', border: '1px solid #e5e7eb',
                                                    }}>
                                                        <FileText size={16} color="#6b7280" />
                                                    </div>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>
                                                        &quot;{document.name}&quot;
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                                                {(document.size / 1024).toFixed(1)} KB
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                            gap: '0.75rem', padding: '0 1.5rem 1.5rem',
                        }}>
                            <button
                                name="Cancel"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                style={{
                                    padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500,
                                    color: '#374151', background: '#f3f4f6', border: 'none',
                                    borderRadius: '0.5rem', cursor: 'pointer', opacity: deleting ? 0.5 : 1,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                name="Delete"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500,
                                    color: 'white', background: '#e11d48', border: 'none',
                                    borderRadius: '0.5rem', cursor: 'pointer', opacity: deleting ? 0.6 : 1,
                                }}
                            >
                                {deleting ? (
                                    <>
                                        <div style={{
                                            width: '1rem', height: '1rem', borderRadius: '50%',
                                            border: '2px solid transparent', borderTopColor: 'white',
                                            animation: 'spin 0.6s linear infinite',
                                        }} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete Permanently
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
