import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="sidebar w-[240px] bg-gray-900 text-white min-h-screen relative">
      <div className="p-4">
        <div className="mb-6 text-center">
          <Link to="/">
            <img
              src="/logo.svg"
              alt="DocuServe"
              className="h-8 mx-auto mb-2"
            />
            <h2 className="text-xl font-bold">DocuServe</h2>
          </Link>
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
      <button
        className="absolute top-4 -right-4 bg-gray-800 rounded-full p-1 transform translate-x-1/2"
        aria-label="Toggle sidebar"
      >
        <svg
          className="lucide-chevron-left w-4 h-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </aside>
  );
};