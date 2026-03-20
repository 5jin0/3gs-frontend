import axios from "axios";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

/** Standard JSON envelope from the backend. */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

// Attach Authorization header automatically for authenticated requests.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (!token) return config;

  // Axios headers type varies across versions, so we cast to a simple record.
  config.headers = config.headers ?? {};
  (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

  return config;
});

export type AuthUser = {
  id: string | number;
  username?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

function assertApiBaseUrl(): string | null {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    // This prevents a hard crash when env is not configured.
    console.error("API base URL is not configured");
    return null;
  }
  return API_BASE_URL ?? null;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const baseUrl = assertApiBaseUrl();
  if (!baseUrl) {
    // Let the caller (UI) handle the message safely.
    throw new Error("API base URL is not configured");
  }

  const payload: LoginRequest = { username, password };

  const res = await api.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

