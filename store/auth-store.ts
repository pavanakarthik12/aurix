"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const AUTH_COOKIE = "aurix_auth";

const ADMIN_EMAIL = "admin@123gmail.com";
const ADMIN_PASSWORD = "admin@123";

export interface AuthUser {
  email: string;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  hydrate: () => void;
}

function setCookie(value: string) {
  document.cookie = `${AUTH_COOKIE}=${value};path=/;max-age=${60 * 60 * 24 * 30}`;
}

function removeCookie() {
  document.cookie = `${AUTH_COOKIE}=;path=/;max-age=0`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (email, password) => {
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
          return { success: false, error: "Invalid email or password" };
        }
        const user: AuthUser = { email, name: "Admin" };
        set({ isAuthenticated: true, user });
        setCookie(JSON.stringify(user));
        return { success: true };
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
        removeCookie();
      },

      hydrate: () => {
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
      },
    }),
    { name: "aurix-auth" }
  )
);
