"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { app, database } from "@/lib/firebase";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { ref, set, onDisconnect, get, serverTimestamp } from "firebase/database";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const playerRef = ref(database, `players/${currentUser.uid}`);
        const existingData = await get(playerRef);

        const alias =
          existingData.exists() && existingData.val()?.alias
            ? existingData.val().alias
            : `Op_${Math.floor(Math.random() * 9000) + 1000}`;

        await set(playerRef, {
          id: currentUser.uid,
          name: currentUser.displayName || alias,
          alias,
          avatar: currentUser.photoURL || null,
          status: "alive",
          connected: true,
          isBot: false,
          survivedRounds: existingData.exists()
            ? existingData.val()?.survivedRounds || 0
            : 0,
          joinedAt: existingData.exists()
            ? existingData.val()?.joinedAt
            : serverTimestamp(),
        });

        onDisconnect(
          ref(database, `players/${currentUser.uid}/connected`)
        ).set(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    const auth = getAuth(app);
    if (user) {
      await set(ref(database, `players/${user.uid}/connected`), false);
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
