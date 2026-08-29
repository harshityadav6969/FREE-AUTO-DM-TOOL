import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { IgAccountsProvider, persistIgAccount } from './lib/igAccounts';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MediaManager from './pages/MediaManager';
import FlowBuilder from './pages/FlowBuilder';
import Analytics from './pages/Analytics';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import ConnectInstagramPage from './pages/ConnectInstagramPage';
import Templates from './pages/Templates';

function InstagramOAuthCatcher() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const handled = React.useRef(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || handled.current || loading) return;
    if (!user) return;
    handled.current = true;

    (async () => {
      try {
        const res = await axios.post('/api/auth/ig/exchange', { code });
        const token = res.data?.token;
        if (token) {
          await persistIgAccount(user.uid, token);
        } else {
          localStorage.setItem('ig_connected', '1');
        }
      } catch (error) {
        console.error('Instagram code exchange failed', error);
      }
      window.history.replaceState({}, '', '/dashboard?connected=1');
      navigate('/dashboard?connected=1', { replace: true });
    })();
  }, [navigate, user, loading]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen bg-[#F4F4F2] flex items-center justify-center">
       <div className="size-10 border-t-2 border-black rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/" />;
  
  return <IgAccountsProvider>{children}</IgAccountsProvider>;
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
            <Route path="/templates" element={<Templates />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/logs" element={<ActivityLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/connect-instagram" element={<ConnectInstagramPage />} />
            <Route path="/connect_instagram" element={<ConnectInstagramPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
