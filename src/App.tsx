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

const PENDING_TOKEN_KEY = "ig_token_pending";
let rootExchangeStarted = false;

function IgRootCallback() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [status, setStatus] = React.useState<"idle" | "exchanging" | "need_google" | "error">(() =>
    new URLSearchParams(window.location.search).has("code") ? "exchanging" : "idle"
  );
  const [error, setError] = React.useState("");
  const persisted = React.useRef(false);

  React.useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")?.split("#")[0].trim();
    if (!code) return;
    if (rootExchangeStarted) {
      setStatus((s) => (s === "idle" ? "exchanging" : s));
      return;
    }
    rootExchangeStarted = true;
    setStatus("exchanging");

    (async () => {
      try {
        const res = await axios.post("/api/ig-exchange", { code }, { timeout: 9000 });
        const token = res.data?.token || "";
        const instagramId = String(res.data?.instagramId || "");
        if (!token) throw new Error("No Instagram token");
        sessionStorage.setItem(PENDING_TOKEN_KEY, JSON.stringify({ token, instagramId }));
        window.history.replaceState({}, "", "/");
        setStatus("need_google");
      } catch (err) {
        console.error("Instagram code exchange failed", err);
        setError("Could not finish Instagram login. Click below to try again.");
        setStatus("error");
      }
    })();
  }, []);

  React.useEffect(() => {
    if (loading || persisted.current) return;
    const raw = sessionStorage.getItem(PENDING_TOKEN_KEY);
    if (!raw) return;
    if (!user) {
      setStatus("need_google");
      return;
    }

    persisted.current = true;
    const { token, instagramId } = JSON.parse(raw) as { token: string; instagramId?: string };
    (async () => {
      try {
        await persistIgAccount(user.uid, token, instagramId || "");
      } catch (persistError) {
        console.error("Saved Instagram token locally; Firestore sync failed", persistError);
        localStorage.setItem("ig_access_token", token);
        localStorage.setItem("ig_connected", "1");
        if (instagramId) localStorage.setItem("ig_user_id", instagramId);
      }
      sessionStorage.removeItem(PENDING_TOKEN_KEY);
      navigate("/dashboard?connected=1", { replace: true });
    })();
  }, [user, loading, navigate, status]);

  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 z-[500] bg-[#F4F4F2] text-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-black/5 p-8 text-center shadow-sm">
        {status === "error" ? (
          <>
            <h1 className="text-xl font-bold mb-2">Instagram connect failed</h1>
            <p className="text-sm text-black/55 mb-6">{error}</p>
            <button
              type="button"
              onClick={() => window.location.replace("/connect-instagram")}
              className="w-full bg-[#D4FF00] text-black font-bold py-3 rounded-2xl"
            >
              Back to Connect Instagram
            </button>
          </>
        ) : status === "need_google" ? (
          <>
            <h1 className="text-xl font-bold mb-2">Sign in to finish connecting</h1>
            <p className="text-sm text-black/55 mb-6">
              Instagram access is saved. Sign in with Google so we can attach it to your workspace.
            </p>
            <button
              type="button"
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
            <p className="text-sm text-black/55">Exchanging Meta login and opening your workspace…</p>
            <button
              type="button"
              onClick={() => window.location.replace("/connect-instagram")}
              className="mt-6 text-sm text-black/50 underline"
            >
              Cancel
            </button>
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
        <Routes>
          <Route
            path="/"
            element={
              <>
                <IgRootCallback />
                <Landing />
              </>
            }
          />
          
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
