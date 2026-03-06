import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import "./App.css";
import { Toaster } from "react-hot-toast";
import { CustomAlert, Sidebar } from "./components";

import { Documents } from './pages/Documents';
import { Upload } from './pages/Upload';
import { DocumentView } from './pages/DocumentView';
import { Home } from './pages/Home';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDocumentView = location.pathname.startsWith('/documents/') && location.pathname !== '/documents';
  const isHome = location.pathname === '/';

  // DIAGNOSTIC: Log current route
  console.log('Current Route:', location.pathname);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+U (or Cmd+U on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        navigate('/upload');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="app-container" style={{ flexDirection: 'row' }}>
      {!isDocumentView && !isHome && <Sidebar />}
      <main className="main-content" style={{
        flex: 1,
        height: '100vh',
        overflowY: (isDocumentView || isHome) ? 'hidden' : 'auto',
        padding: (isDocumentView || isHome) ? 0 : '2rem',
        maxWidth: (isDocumentView || isHome) ? '100%' : '1200px'
      }}>
        <Routes>
          {/* Home route */}
          <Route path="/" element={<Home />} />
          
          {/* DIAGNOSTIC: Documents route with container */}
          <Route 
            path="/documents" 
            element={
              <div id="documents-container">
                <span>DOCUMENTS_CONTAINER_LOADED</span>
                <Documents />
              </div>
            } 
          />
          
          {/* IMPORTANT: More specific route AFTER generic route */}
          <Route path="/documents/:id" element={<DocumentView />} />
          
          {/* Upload route */}
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <CustomAlert />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;