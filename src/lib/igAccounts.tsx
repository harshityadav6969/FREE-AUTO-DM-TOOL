import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import axios from "axios";

export type IgAccount = {
  id: string;
  instagramId: string;
  username: string;
  name?: string;
  pageAccessToken: string;
  profilePicture?: string;
  followersCount?: number;
  mediaCount?: number;
  isActive?: boolean;
};

type Ctx = {
  accounts: IgAccount[];
  primary: IgAccount | null;
  loading: boolean;
  connected: boolean;
  saveFromToken: (token: string) => Promise<IgAccount | null>;
};

const IgContext = createContext<Ctx | undefined>(undefined);

export async function persistIgAccount(uid: string, token: string, knownId = "") {
  let profile: Partial<IgAccount> = {
    instagramId: knownId,
    pageAccessToken: token,
    isActive: true,
  };

  try {
    const res = await axios.get("/api/ig/me", {
      params: { accessToken: token },
      timeout: 8000,
    });
    profile = { ...profile, ...(res.data as IgAccount) };
  } catch (error) {
    console.error("Instagram profile fetch skipped", error);
  }

  const instagramId = String(profile.instagramId || knownId).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!instagramId) throw new Error("No Instagram user id");

  const payload = {
    instagramId,
    pageAccessToken: token,
    username: profile.username || "",
    name: profile.name || profile.username || "",
    profilePicture: profile.profilePicture || "",
    followersCount: profile.followersCount || 0,
    mediaCount: profile.mediaCount || 0,
    isActive: true,
  };

  const saved = { id: instagramId, ...payload } as IgAccount;
  localStorage.setItem("ig_access_token", token);
  localStorage.setItem("ig_connected", "1");
  localStorage.setItem("ig_username", payload.username);
  localStorage.setItem("ig_user_id", instagramId);
  localStorage.setItem("ig_account", JSON.stringify(saved));
  try {
    await setDoc(doc(db, `users/${uid}/accounts/${instagramId}`), payload, { merge: true });
    await setDoc(
      doc(db, `igLookup/${instagramId}`),
      {
        uid,
        accountId: instagramId,
        pageAccessToken: token,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log("Profile write succeeded", { uid, instagramId, username: payload.username });
    axios.post("/api/ig/subscribe", { accessToken: token, igUserId: instagramId }).catch((error) => {
      console.error("IG webhook subscribe skipped", error);
    });
  } catch (error) {
    console.error("Profile write failed", error);
    throw error;
  }
  return saved;
}

export function IgAccountsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    const hydrateLocal = () => {
      try {
        const cached = localStorage.getItem("ig_account");
        if (cached) {
          setAccounts([JSON.parse(cached) as IgAccount]);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    };

    const unsub = onSnapshot(
      collection(db, `users/${user.uid}/accounts`),
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IgAccount, "id">) }));
        if (next.length) {
          setAccounts(next);
          setLoading(false);
          return;
        }
        void hydrateLocal();
      },
      () => {
        void hydrateLocal();
      }
    );
    return unsub;
  }, [user]);

  const saveFromToken = async (token: string) => {
    if (!user) return null;
    return persistIgAccount(user.uid, token);
  };

  const primary = accounts[0] || null;
  const connected = accounts.some((a) => a.pageAccessToken && a.isActive !== false);

  return (
    <IgContext.Provider value={{ accounts, primary, loading, connected, saveFromToken }}>
      {children}
    </IgContext.Provider>
  );
}

export function useIgAccounts() {
  const ctx = useContext(IgContext);
  if (!ctx) throw new Error("useIgAccounts must be used within IgAccountsProvider");
  return ctx;
}
