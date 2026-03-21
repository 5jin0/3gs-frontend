import axios from "axios";
import { api, type ApiSuccessResponse } from "@/lib/api";

const ADMIN_OVERVIEW_ENDPOINT = "/admin/overview";

/** Loose shape so different backend field names still render. */
export type AdminOverview = {
  user_count?: number;
  term_count?: number;
  saved_term_count?: number;
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
