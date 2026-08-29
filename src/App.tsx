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

const IG_CODE_KEY = "ig_oauth_code";
let igExchangeLock = "";

function readIgOAuthCode() {
  const fromUrl = new URLSearchParams(window.location.search).get("code");
  if (fromUrl) {
    const clean = fromUrl.split("#")[0].trim();
    sessionStorage.setItem(IG_CODE_KEY, clean);
    return clean;
  }
  return sessionStorage.getItem(IG_CODE_KEY) || "";
}

function InstagramOAuthCatcher() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [code] = React.useState(() => readIgOAuthCode());
  const [error, setError] = React.useState("");
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!code || handled.current || loading) return;
    if (!user) return;
    if (igExchangeLock === code) return;
    handled.current = true;
    igExchangeLock = code;

    (async () => {
      try {
        let token = "";
        const paths = ["/api/ig-exchange", "/api/auth/ig/exchange", "/api/auth/ig-exchange"];
        for (const path of paths) {
          try {
            const res = await axios.post(path, { code });
            token = res.data?.token || "";
            if (token) break;
          } catch {
            // try next exchange path
          }
        }
        if (!token) throw new Error("No Instagram token");
        try {
          await persistIgAccount(user.uid, token);
        } catch (persistError) {
          console.error("Saved Instagram token locally; Firestore sync failed", persistError);
          localStorage.setItem("ig_access_token", token);
          localStorage.setItem("ig_connected", "1");
        }
        sessionStorage.removeItem(IG_CODE_KEY);
        navigate("/dashboard?connected=1", { replace: true });
      } catch (err) {
        console.error("Instagram code exchange failed", err);
        setError("Could not finish Instagram login. You can retry from Connect Instagram.");
        sessionStorage.removeItem(IG_CODE_KEY);
      }
    })();
  }, [navigate, user, loading, code]);

  if (!code) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-[#F4F4F2] text-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-black/5 p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-xl font-bold mb-2">Instagram connect failed</h1>
            <p className="text-sm text-black/55 mb-6">{error}</p>
            <button
              onClick={() => navigate("/connect-instagram", { replace: true })}
              className="w-full bg-[#D4FF00] text-black font-bold py-3 rounded-2xl"
            >
              Back to Connect Instagram
            </button>
          </>
        ) : !user && !loading ? (
          <>
            <h1 className="text-xl font-bold mb-2">Sign in to finish connecting</h1>
            <p className="text-sm text-black/55 mb-6">
              Instagram approved access. Sign in with Google so we can save the account to your workspace.
            </p>
            <button
              onClick={() => signIn()}
              className="w-full bg-black text-white font-bold py-3 rounded-2xl"
            >
              Continue with Google
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto size-10 border-t-2 border-black rounded-full animate-spin mb-4" />
            <h1 className="text-xl font-bold mb-2">Connecting Instagram</h1>
            <p className="text-sm text-black/55">Finishing Meta login and saving your account…</p>
          </>
        )}
      </div>
    </div>
  );
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
