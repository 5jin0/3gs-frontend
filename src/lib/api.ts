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
  /** Present when backend includes it in login/user payloads (JWT may lag DB). */
  is_admin?: boolean;
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

type LoginEnvelope = ApiSuccessResponse<LoginResponse>;

type MeEnvelopeUser = ApiSuccessResponse<AuthUser | { user: AuthUser }>;

function unwrapAuthMeBody(body: unknown): AuthUser | null {
  if (!body || typeof body !== "object") return null;

  if (
    "success" in body &&
    (body as MeEnvelopeUser).success === true &&
    "data" in body
  ) {
    const data = (body as MeEnvelopeUser).data;
    if (data && typeof data === "object") {
      if ("user" in data && (data as { user?: unknown }).user && typeof (data as { user: unknown }).user === "object") {
        return (data as { user: AuthUser }).user;
      }
      if ("id" in data) return data as AuthUser;
    }
    return null;
  }

  if ("user" in body && (body as { user?: unknown }).user && typeof (body as { user: unknown }).user === "object") {
    return (body as { user: AuthUser }).user;
  }

  if ("id" in body) return body as AuthUser;

  return null;
}

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

  const res = await api.post<LoginResponse | LoginEnvelope>("/auth/login", payload);
  const body = res.data;

  if (
    body &&
    typeof body === "object" &&
    "success" in body &&
    "data" in body &&
    (body as LoginEnvelope).success === true
  ) {
    return (body as LoginEnvelope).data;
  }

  return body as LoginResponse;
}

/** Current user from the server; requires a stored access token (Bearer). */
export async function fetchAuthMe(): Promise<AuthUser> {
  const baseUrl = assertApiBaseUrl();
  if (!baseUrl) {
    throw new Error("API base URL is not configured");
  }

  const res = await api.get<AuthUser | MeEnvelopeUser | { user: AuthUser }>("/auth/me");
  const user = unwrapAuthMeBody(res.data);
  if (!user) {
    throw new Error("Invalid /auth/me response shape");
  }
  return user;
}

