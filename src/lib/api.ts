import axios from "axios";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

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

function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set.");
  }
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  assertApiBaseUrl();

  const payload: LoginRequest = { username, password };

  const res = await api.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

