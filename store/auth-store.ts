"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const AUTH_COOKIE = "aurix_auth";

const ADMIN_EMAIL = "admin@123gmail.com";
const ADMIN_PASSWORD = "admin@123";

export interface AuthUser {
  email: string;
  name: string;
  uid?: string;
  photoURL?: string;
  provider?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hydrate: () => void;
}

function setCookie(value: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE}=${value};path=/;max-age=${60 * 60 * 24 * 30}`;
  }
}

function removeCookie() {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE}=;path=/;max-age=0`;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      loading: false,

      login: async (email, password) => {
        // Fallback for demo admin credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          const user: AuthUser = { email, name: "Admin", provider: "demo" };
          set({ isAuthenticated: true, user });
          setCookie(JSON.stringify(user));
          return { success: true };
        }

        try {
          const res = await signInWithEmailAndPassword(auth, email, password);
          const user: AuthUser = {
            email: res.user.email || email,
            name: res.user.displayName || email.split("@")[0],
            uid: res.user.uid,
            photoURL: res.user.photoURL || undefined,
            provider: "firebase",
          };
          set({ isAuthenticated: true, user });
          setCookie(JSON.stringify(user));
          return { success: true };
        } catch (err: any) {
          const msg = err?.message || "Failed to sign in with Firebase";
          return { success: false, error: msg.replace("Firebase: ", "") };
        }
      },

      register: async (email, password, name) => {
        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          if (res.user) {
            await updateProfile(res.user, { displayName: name });
          }
          const user: AuthUser = {
            email: res.user.email || email,
            name: name || email.split("@")[0],
            uid: res.user.uid,
            provider: "firebase",
          };
          set({ isAuthenticated: true, user });
          setCookie(JSON.stringify(user));
          return { success: true };
        } catch (err: any) {
          const msg = err?.message || "Failed to create Firebase user";
          return { success: false, error: msg.replace("Firebase: ", "") };
        }
      },

      loginWithGoogle: async () => {
        try {
          const res = await signInWithPopup(auth, googleProvider);
          const user: AuthUser = {
            email: res.user.email || "",
            name: res.user.displayName || "Google User",
            uid: res.user.uid,
            photoURL: res.user.photoURL || undefined,
            provider: "google",
          };
          set({ isAuthenticated: true, user });
          setCookie(JSON.stringify(user));
          return { success: true };
        } catch (err: any) {
          const msg = err?.message || "Google Sign-In failed";
          return { success: false, error: msg.replace("Firebase: ", "") };
        }
      },

      logout: async () => {
        try {
          await firebaseSignOut(auth);
        } catch {
          /* ignore */
        }
        set({ isAuthenticated: false, user: null });
        removeCookie();
      },

      hydrate: () => {
        if (typeof window !== "undefined") {
          onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
              const user: AuthUser = {
                email: firebaseUser.email || "",
                name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                uid: firebaseUser.uid,
                photoURL: firebaseUser.photoURL || undefined,
                provider: "firebase",
              };
              set({ isAuthenticated: true, user });
              setCookie(JSON.stringify(user));
            }
          });

          const stored = localStorage.getItem("aurix-auth");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed?.state?.isAuthenticated) {
                const user = parsed.state.user;
                setCookie(JSON.stringify(user));
              }
            } catch {
              /* ignore */
            }
          }
        }
      },
    }),
    { name: "aurix-auth" }
  )
);
