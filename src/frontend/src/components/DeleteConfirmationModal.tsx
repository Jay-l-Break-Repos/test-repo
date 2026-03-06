import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentName: string;
    documentId: number;
    onDeleted: () => void;
}

/**
 * A confirmation modal shown before permanently deleting a document.
 * Requires the user to explicitly confirm before the deletion is executed.
 */
export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    documentName,
    onDeleted,
}) => {
    if (!isOpen) return null;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-labelledby="delete-modal-title"
        >
            {/* Panel — stop click propagation so backdrop click doesn't fire inside */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close (×) button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
                    <AlertTriangle size={24} className="text-red-500" strokeWidth={2} />
                </div>

                {/* Title */}
                <h2
                    id="delete-modal-title"
                    className="text-lg font-semibold text-gray-900 mb-2"
                >
                    Delete Document
                </h2>

                {/* Body */}
                <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-gray-700 break-all">"{documentName}"</span>?
                    This action cannot be undone.
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDeleted}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
