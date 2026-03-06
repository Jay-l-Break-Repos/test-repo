import { X } from 'lucide-react';
import { showSuccess } from '../utils/toast';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentName: string;
    documentId: number;
    onDeleted: () => void;
}

export const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    documentName,
    onDeleted
}: DeleteConfirmationModalProps) => {
    if (!isOpen) return null;

    const handleDelete = () => {
        onDeleted();
        showSuccess('Document deleted successfully');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Delete Document</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete "{documentName}"?
                    </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        data-testid="cancel-delete"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        data-testid="confirm-delete"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};