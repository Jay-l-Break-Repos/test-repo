import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="sidebar w-[240px] bg-gray-900 text-white min-h-screen">
      <div className="p-4">
        <div className="mb-6 text-center">
          <img
            src="/logo.svg"
            alt="DocuServe"
            className="h-8 mx-auto mb-2"
          />
          <h2 className="text-xl font-bold">DocuServe</h2>
        </div>
        <nav role="navigation">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className={`block px-4 py-2 rounded hover:bg-gray-800 ${
                  isActive('/') ? 'active bg-gray-800' : ''
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/documents"
                className={`block px-4 py-2 rounded hover:bg-gray-800 ${
                  isActive('/documents') ? 'active bg-gray-800' : ''
                }`}
              >
                Documents
              </Link>
            </li>
            <li>
              <Link
                to="/upload"
                className={`block px-4 py-2 rounded hover:bg-gray-800 ${
                  isActive('/upload') ? 'active bg-gray-800' : ''
                }`}
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