import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { IgAccountsProvider } from './lib/igAccounts';
import { attachPendingIgToken, savePendingIgToken, hasPendingIgToken } from './lib/pendingIg';
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

let rootExchangeStarted = false;

function stripCodeFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("code")) return;
  url.searchParams.delete("code");
  url.hash = "";
  const next = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams}` : ""}`;
  window.history.replaceState({}, "", next || "/");
}

function IgRootCallback() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [status, setStatus] = React.useState<"idle" | "exchanging" | "need_google" | "error">(() =>
    new URLSearchParams(window.location.search).has("code") || hasPendingIgToken()
      ? hasPendingIgToken() && !new URLSearchParams(window.location.search).has("code")
        ? "need_google"
        : "exchanging"
      : "idle"
  );
  const [error, setError] = React.useState("");
  const persisted = React.useRef(false);

  React.useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")?.split("#")[0].trim();
    if (!code) {
      if (hasPendingIgToken()) setStatus("need_google");
      return;
    }

    const lockKey = `ig_exchanged:${code}`;
    if (sessionStorage.getItem(lockKey) === "1" || rootExchangeStarted) {
      stripCodeFromUrl();
      setStatus((s) => (s === "idle" ? "exchanging" : s));
      return;
    }
    rootExchangeStarted = true;
    sessionStorage.setItem(lockKey, "1");
    setStatus("exchanging");

    (async () => {
      try {
        const res = await axios.post("/api/ig-exchange", { code }, { timeout: 12000 });
        const token = res.data?.token || "";
        const instagramId = String(res.data?.instagramId || "");
        if (!token) throw new Error("No Instagram token");
        savePendingIgToken(token, instagramId, {
          expiresIn: Number(res.data?.expiresIn || 0) || undefined,
          tokenType: String(res.data?.tokenType || ""),
        });
        stripCodeFromUrl();
        setStatus("need_google");
      } catch (err) {
        stripCodeFromUrl();
        const data = axios.isAxiosError(err) ? err.response?.data : null;
        console.error("Instagram code exchange failed", data || err);
        const details = (data as { details?: unknown; error?: unknown } | null) || {};
        const nested = details.details as { error_message?: string; error_type?: string; error?: unknown; message?: string } | undefined;
        const topError = details.error;
        const message =
          nested?.error_message ||
          nested?.error_type ||
          nested?.message ||
          (typeof nested?.error === "string" ? nested.error : "") ||
          (typeof topError === "string" ? topError : "") ||
          (topError && typeof topError === "object" && "message" in topError
            ? String((topError as { message?: string }).message)
            : "") ||
          (axios.isAxiosError(err) ? `Instagram login failed (${err.response?.status || err.code})` : "") ||
          "Instagram connection incomplete, please reconnect";
        setError(String(message));
        setStatus("error");
      }
    })();
  }, []);

  React.useEffect(() => {
    if (loading || persisted.current) return;
    if (!hasPendingIgToken()) return;
    if (!user) {
      setStatus("need_google");
      return;
    }

    persisted.current = true;
    (async () => {
      try {
        await attachPendingIgToken(user.uid);
        navigate("/dashboard?connected=1", { replace: true });
      } catch (persistError) {
        console.error("Saved Instagram token locally; attach failed", persistError);
        setError("Instagram token was received but could not be saved to your workspace.");
        setStatus("error");
      }
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
