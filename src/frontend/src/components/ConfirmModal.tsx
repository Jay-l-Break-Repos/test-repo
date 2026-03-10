import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
            onClick={onCancel}
        >
            <div
                className="relative pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 rounded-xl">
                            <AlertTriangle size={20} className="text-rose-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
