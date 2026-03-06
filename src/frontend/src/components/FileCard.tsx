import React from 'react';

interface FileCardProps {
  file: File;
  onSubmit: () => void;
  onCancel: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onSubmit, onCancel }) => {
  return (
    <div className="file-card-premium bg-white rounded-lg shadow-lg p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{file.name}</h3>
          <p className="text-sm text-gray-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Type: {file.type || 'Unknown'}
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </div>
    </div>
  );
};