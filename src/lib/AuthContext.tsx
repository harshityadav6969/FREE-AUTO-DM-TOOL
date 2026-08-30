import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { auth } from './firebase';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '../types';
import { attachPendingIgToken } from './pendingIg';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      console.log("Google auth state changed, user:", nextUser?.uid ?? null);

      if (!nextUser) return;
      (async () => {
        try {
          await attachPendingIgToken(nextUser.uid);
        } catch (e) {
          console.error("Pending IG attach after Google auth failed", e);
        }
        try {
          const ref = doc(db, "users", nextUser.uid);
          const existing = await getDoc(ref);
          if (!existing.exists()) {
            await setDoc(ref, {
              uid: nextUser.uid,
              email: nextUser.email ?? "",
              displayName: nextUser.displayName ?? "User",
              photoURL: nextUser.photoURL ?? "",
              subscriptionTier: "FREE",
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error("Failed to create user profile", e);
        }
      })();
    });
    return unsubscribe;
  }, []);

  const profile = user ? {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? 'User',
    photoURL: user.photoURL ?? '',
    subscriptionTier: 'free',
    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now(),
  } satisfies UserProfile : null;

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const firebaseError = error as { code?: string };

      if (
        firebaseError.code === 'auth/popup-blocked' ||
        firebaseError.code === 'auth/popup-closed-by-user' ||
        firebaseError.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }

      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn: loginWithGoogle, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
