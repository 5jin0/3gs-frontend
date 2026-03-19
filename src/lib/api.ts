import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
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

