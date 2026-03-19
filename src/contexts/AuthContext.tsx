"use client";

import type { AuthUser } from "@/lib/api";
import {
  AUTH_CHANGE_EVENT,
  clearAuth,
  getAccessToken,
  getUser,
  isLoggedIn,
} from "@/lib/auth";
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

  const logout = useCallback(() => {
    clearAuth();
    refreshAuth();
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn: isLoggedIn(),
      accessToken,
      user,
      refreshAuth,
      logout,
    }),
    [accessToken, logout, refreshAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

