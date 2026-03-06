import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCard } from '../components/FileCard';
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

  const handleSubmit = async () => {
    if (!file) return;
    // File upload logic will be implemented later
    console.log('Uploading file:', file);
  };

  const handleCancel = () => {
    setFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Document</h1>
      <div className="p-6 bg-white rounded-lg shadow">
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {file && (
          <FileCard
            file={file}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};