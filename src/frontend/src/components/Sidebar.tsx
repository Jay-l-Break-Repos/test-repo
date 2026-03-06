import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-gray-800' : '';
  };

  return (
    <aside className="sidebar w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">DocuServe</h2>
        <nav role="navigation">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className={`block px-4 py-2 rounded hover:bg-gray-800 ${isActive('/')}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/documents"
                className={`block px-4 py-2 rounded hover:bg-gray-800 ${isActive('/documents')}`}
              >
                Documents
              </Link>
            </li>
            <li>
              <Link
                to="/upload"
                className={`block px-4 py-2 rounded hover:bg-gray-800 ${isActive('/upload')}`}
              >
                Upload
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};