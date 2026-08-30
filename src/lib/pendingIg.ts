import { persistIgAccount } from "./igAccounts";

export const PENDING_IG_TOKEN_KEY = "pendingIgToken";

export type PendingIgToken = {
  token: string;
  instagramId: string;
};

export function savePendingIgToken(token: string, instagramId: string) {
  const payload: PendingIgToken = { token, instagramId };
  sessionStorage.setItem(PENDING_IG_TOKEN_KEY, JSON.stringify(payload));
  console.log("IG token saved to pending storage");
}

export function readPendingIgToken(): PendingIgToken | null {
  const raw = sessionStorage.getItem(PENDING_IG_TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingIgToken;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingIgToken() {
  sessionStorage.removeItem(PENDING_IG_TOKEN_KEY);
}

export function hasPendingIgToken() {
  return Boolean(readPendingIgToken());
}

export async function attachPendingIgToken(uid: string) {
  const pending = readPendingIgToken();
  if (!pending) return false;

  console.log("Attempting to attach pending IG token to profile");
  try {
    await persistIgAccount(uid, pending.token, pending.instagramId || "");
    console.log("Profile write succeeded");
    clearPendingIgToken();
    return true;
  } catch (error) {
    console.error("Profile write failed", error);
    throw error;
  }
}
