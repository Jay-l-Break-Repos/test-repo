import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentName: string;
    documentId: number;
    onDeleted: () => void;
}

/**
 * DeleteConfirmationModal — asks the user to confirm before permanently
 * deleting a document. Follows the DocuServe premium design system.
 */
export const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    documentName,
    onDeleted,
}: DeleteConfirmationModalProps) => {
    if (!isOpen) return null;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal panel */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                {/* Icon + heading */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-red-50 rounded-xl">
                        <AlertTriangle size={22} className="text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Delete Document</h2>
                </div>

                {/* Body */}
                <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to permanently delete the following document?
                    This action <span className="font-semibold text-gray-800">cannot be undone</span>.
                </p>

                {/* Document name table */}
                <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-700">File name</td>
                                <td className="px-4 py-3 text-gray-900 font-semibold break-all">
                                    {documentName}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
