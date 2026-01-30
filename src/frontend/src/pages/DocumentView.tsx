import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { type ApiDocument, getDocument } from '../services/document.api';
import axios from 'axios';
import { showError } from '../utils/toast';


import './DocumentView.css';

export const DocumentView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<ApiDocument | null>(null);
    const [textContent, setTextContent] = useState("");
    const [loading, setLoading] = useState(true);


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

                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="document-scroll-area">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};
