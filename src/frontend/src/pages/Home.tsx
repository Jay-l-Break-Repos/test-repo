import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <h1 className="text-4xl font-bold mb-6">Welcome to DocuServe</h1>
      <p className="hero-description text-xl text-gray-600 mb-8">
        Your secure document management solution. Upload, view, and manage your documents with ease.
      </p>
      <div className="space-x-4">
        <Link
          to="/documents"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Workspace
        </Link>
        <Link
          to="/upload"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Upload File
        </Link>
      </div>
    </div>
  );
};