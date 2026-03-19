import type { AuthUser } from "@/lib/api";

const ACCESS_TOKEN_KEY = "panjopass_access_token";
const USER_KEY = "panjopass_user";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseLocalStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (!canUseLocalStorage()) return null;

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(accessToken: string, user: AuthUser): void {
  if (!canUseLocalStorage()) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

