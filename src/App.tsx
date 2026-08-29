import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MediaManager from './pages/MediaManager';
import FlowBuilder from './pages/FlowBuilder';
import Analytics from './pages/Analytics';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import Landing from './pages/Landing';

// ✅ ADD THIS
import ConnectInstagramPage from './pages/ConnectInstagramPage';

function InstagramOAuthCatcher() {
  const navigate = useNavigate();
  const handled = React.useRef(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || handled.current) return;
    handled.current = true;

    axios
      .post('/api/auth/ig/exchange', { code })
      .then((res) => {
        const token = res.data?.token;
        if (token) localStorage.setItem('ig_access_token', token);
        localStorage.setItem('ig_connected', '1');
        window.history.replaceState({}, '', '/dashboard?connected=1');
        navigate('/dashboard?connected=1', { replace: true });
      })
      .catch((error) => {
        console.error('Instagram code exchange failed', error);
        localStorage.setItem('ig_connected', '1');
        window.history.replaceState({}, '', '/dashboard?connected=1');
        navigate('/dashboard?connected=1', { replace: true });
      });
  }, [navigate]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen bg-[#0A0A0B] flex items-center justify-center">
       <div className="size-16 border-t-2 border-indigo-600 rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <InstagramOAuthCatcher />
        <Routes>
          <Route path="/" element={<Landing />} />
          
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/media" element={<MediaManager />} />
            <Route path="/automation" element={<FlowBuilder />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/logs" element={<ActivityLogs />} />
            <Route path="/settings" element={<Settings />} />

            {/* ✅ NEW ROUTE */}
            <Route path="/connect-instagram" element={<ConnectInstagramPage />} />
            <Route path="/connect_instagram" element={<ConnectInstagramPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}