import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Upload.css';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // File upload logic will be implemented later
    console.log('Uploading file:', file);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Document</h1>
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
        <div className="mb-6">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Upload
          </button>
        </div>
      </form>
    </div>
  );
};