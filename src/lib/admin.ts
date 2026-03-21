import axios from "axios";
import { api, type ApiSuccessResponse } from "@/lib/api";
import { normalizePangyoTerm, type PangyoTerm } from "@/lib/pangyo-terms";

const ADMIN_OVERVIEW_ENDPOINT = "/admin/overview";
const ADMIN_USERS_ENDPOINT = "/admin/users";
const ADMIN_TERMS_ENDPOINT = "/admin/terms";

/** Loose shape so different backend field names still render. */
export type AdminOverview = {
  user_count?: number;
  term_count?: number;
  saved_term_count?: number;
  [key: string]: unknown;
};

/** User row from admin user list endpoints. */
export type AdminUser = {
  id: string | number;
  username?: string;
  name?: string;
  email?: string;
  is_admin?: boolean;
  created_at?: string;
  [key: string]: unknown;
};

type OverviewEnvelope = ApiSuccessResponse<AdminOverview>;

function unwrapOverview(body: unknown): AdminOverview | null {
  if (!body || typeof body !== "object") return null;

  const top = body as Record<string, unknown>;
  if ("success" in top && top.success === false) return null;

  if (
    "success" in body &&
    (body as OverviewEnvelope).success === true &&
    "data" in body &&
    (body as OverviewEnvelope).data != null &&
    typeof (body as OverviewEnvelope).data === "object"
  ) {
    return (body as OverviewEnvelope).data as AdminOverview;
  }

  if ("data" in body && (body as { data?: unknown }).data != null && typeof (body as { data: unknown }).data === "object") {
    return (body as { data: AdminOverview }).data;
  }

  const rec = body as Record<string, unknown>;
  if ("success" in rec && rec.success === true) return null;

  if (Object.keys(rec).length > 0) {
    return body as AdminOverview;
  }

  return null;
}

function unwrapDataArray<T>(body: unknown): T[] | null {
  if (Array.isArray(body)) return body as T[];

  if (!body || typeof body !== "object") return null;
  const top = body as Record<string, unknown>;

  if ("success" in top && top.success === false) return null;

  if ("success" in top && top.success === true && "data" in top) {
    const d = top.data;
    if (Array.isArray(d)) return d as T[];
    if (d && typeof d === "object" && !Array.isArray(d)) {
      const inner = d as Record<string, unknown>;
      for (const key of ["users", "items", "results", "terms"] as const) {
        const v = inner[key];
        if (Array.isArray(v)) return v as T[];
      }
    }
  }

  if ("data" in top && Array.isArray(top.data)) return top.data as T[];

  for (const key of ["users", "items", "results", "terms"] as const) {
    const v = top[key];
    if (Array.isArray(v)) return v as T[];
  }

  return null;
}

/** Aggregated stats for the admin dashboard (admin-only endpoint). */
export async function fetchAdminOverview(): Promise<AdminOverview> {
  const res = await api.get<unknown>(ADMIN_OVERVIEW_ENDPOINT);
  const parsed = unwrapOverview(res.data);
  if (!parsed) {
    throw new Error("Invalid admin overview response");
  }
  return parsed;
}

export function isAdminForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function isAdminOverviewNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/** Paginated or full user list for admin (admin-only). */
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await api.get<unknown>(ADMIN_USERS_ENDPOINT);
  const list = unwrapDataArray<AdminUser>(res.data);
  if (!list) {
    throw new Error("Invalid admin users response");
  }
  return list;
}

export function isAdminUsersNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/** Admin glossary list (admin-only). Rows are normalized like search results. */
export async function fetchAdminTerms(): Promise<PangyoTerm[]> {
  const res = await api.get<unknown>(ADMIN_TERMS_ENDPOINT);
  const list = unwrapDataArray<unknown>(res.data);
  if (!list) {
    throw new Error("Invalid admin terms response");
  }
  return list
    .map((raw) => normalizePangyoTerm(raw))
    .filter((x): x is PangyoTerm => x !== null);
}

export function isAdminTermsNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
