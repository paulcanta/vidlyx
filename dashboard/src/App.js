import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ShortcutsProvider } from './contexts/ShortcutsContext';
import { ShortcutsHelp } from './components/Shortcuts';
import './App.css';

import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MainLayout from './components/Layout/MainLayout';

// Lazy load page components for code splitting
const Home = lazy(() => import('./pages/app/Home'));
const Videos = lazy(() => import('./pages/app/Videos'));
const NewVideo = lazy(() => import('./pages/app/NewVideo'));
const VideoAnalysis = lazy(() => import('./pages/app/VideoAnalysis'));
const Collection = lazy(() => import('./pages/app/Collection'));
const SaveView = lazy(() => import('./pages/app/SaveView'));
const Settings = lazy(() => import('./pages/app/Settings'));

// PageLoader component with spinner
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return !user ? children : <Navigate to="/app" />;
}

function App() {
  return (
    <Router>
      <ShortcutsProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/app" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
              <Route path="videos" element={<Suspense fallback={<PageLoader />}><Videos /></Suspense>} />
              <Route path="new" element={<Suspense fallback={<PageLoader />}><NewVideo /></Suspense>} />
              <Route path="video/:id" element={<Suspense fallback={<PageLoader />}><VideoAnalysis /></Suspense>} />
              <Route path="collection" element={<Suspense fallback={<PageLoader />}><Collection /></Suspense>} />
              <Route path="collection/save/:saveId" element={<Suspense fallback={<PageLoader />}><SaveView /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
            </Route>
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <ShortcutsHelp />
        </div>
      </ShortcutsProvider>
    </Router>
  );
}

export default App;
