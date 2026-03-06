import React from 'react';
import './Home.css';

export const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Welcome to DocuServe</h1>
      <p className="text-lg text-gray-600">
        Your secure document management solution. Upload, view, and manage your documents with ease.
      </p>
    </div>
  );
};