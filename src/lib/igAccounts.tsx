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

export async function persistIgAccount(uid: string, token: string) {
  const res = await axios.get("/api/ig/me", { params: { accessToken: token } });
  const profile = res.data as IgAccount;
  const instagramId = String(profile.instagramId || "").replace(/[^a-zA-Z0-9_-]/g, "");
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

  await setDoc(doc(db, `users/${uid}/accounts/${instagramId}`), payload, { merge: true });
  localStorage.setItem("ig_access_token", token);
  localStorage.setItem("ig_connected", "1");
  localStorage.setItem("ig_username", payload.username);
  return { id: instagramId, ...payload } as IgAccount;
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
    const unsub = onSnapshot(collection(db, `users/${user.uid}/accounts`), (snap) => {
      setAccounts(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IgAccount, "id">) }))
      );
      setLoading(false);
    });
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
