import React from 'react';
import './Upload.css';

export const Upload: React.FC = () => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // File upload logic will be implemented later
    console.log('File selected:', event.target.files?.[0]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Document</h1>
      <div className="p-6 bg-white rounded-lg shadow">
        <input
          type="file"
          onChange={handleFileUpload}
          className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
    </div>
  );
};