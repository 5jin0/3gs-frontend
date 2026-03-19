import type { AuthUser } from "@/lib/api";

const ACCESS_TOKEN_KEY = "panjopass_access_token";
const USER_KEY = "panjopass_user";
export const AUTH_CHANGE_EVENT = "panjopass:auth";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseLocalStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
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
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearAuth(): void {
  if (!canUseLocalStorage()) return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

