"use client";

import { fetchAuthMe, type AuthUser } from "@/lib/api";
import {
  AUTH_CHANGE_EVENT,
  clearAuth,
  getAccessToken,
  getUser,
  setAuth,
} from "@/lib/auth";
import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  /** False while a token exists and `/auth/me` has not finished (avoids flashing admin UI). */
  isSessionProfileReady: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  refreshAuth: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getAccessToken();
    return token ? getUser() : null;
  });
  const [isSessionProfileReady, setSessionProfileReady] = useState(
    () => !getAccessToken(),
  );

  const refreshAuth = useCallback(() => {
    const token = getAccessToken();
    const nextUser = token ? getUser() : null;
    setAccessToken(token);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    // Same-tab updates won't trigger `storage` events, so we subscribe to a custom event.
    window.addEventListener(AUTH_CHANGE_EVENT, refreshAuth);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, refreshAuth);
  }, [refreshAuth]);

  // Hydrate / refresh profile from the server so `is_admin` etc. match the DB after reload.
  useEffect(() => {
    if (!accessToken) {
      setSessionProfileReady(true);
      return;
    }

    setSessionProfileReady(false);
    let cancelled = false;

    void (async () => {
      try {
        const me = await fetchAuthMe();
        if (cancelled) return;
        const token = getAccessToken();
        if (!token || token !== accessToken) return;
        const prev = getUser();
        const merged: AuthUser = { ...(prev ?? {}), ...me };
        setAuth(token, merged);
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearAuth();
          refreshAuth();
        }
      } finally {
        if (!cancelled) setSessionProfileReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshAuth]);

  const logout = useCallback(() => {
    clearAuth();
    refreshAuth();
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn: Boolean(accessToken),
      isAdmin: user?.is_admin === true,
      isSessionProfileReady,
      accessToken,
      user,
      refreshAuth,
      logout,
    }),
    [accessToken, isSessionProfileReady, logout, refreshAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

