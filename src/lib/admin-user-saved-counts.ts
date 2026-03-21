import axios from "axios";
import { api, type ApiSuccessResponse } from "@/lib/api";

const USER_SAVED_COUNTS_ENDPOINT = "/admin/analytics/user-saved-counts";

export type UserSavedCountSort =
  | "save_count_desc"
  | "save_count_asc"
  | "username_asc"
  | "username_desc";

export type UserSavedCountRow = {
  user_id?: string | number;
  username?: string;
  email?: string;
  save_count?: number;
  [key: string]: unknown;
};

export type PagedUserSavedCounts = {
  items: UserSavedCountRow[];
  total: number;
  page: number;
  page_size: number;
};

type PagedEnvelope = ApiSuccessResponse<PagedUserSavedCounts>;

function num(o: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function unwrapPagedBody(body: unknown): PagedUserSavedCounts | null {
  if (!body || typeof body !== "object") return null;

  const top = body as Record<string, unknown>;
  if ("success" in top && top.success === false) return null;

  let raw: Record<string, unknown> | null = null;

  if (
    "success" in top &&
    (top as PagedEnvelope).success === true &&
    "data" in top &&
    (top as PagedEnvelope).data != null &&
    typeof (top as PagedEnvelope).data === "object" &&
    !Array.isArray((top as PagedEnvelope).data)
  ) {
    raw = (top as PagedEnvelope).data as Record<string, unknown>;
  } else if ("data" in top && top.data != null && typeof top.data === "object" && !Array.isArray(top.data)) {
    raw = top.data as Record<string, unknown>;
  } else if ("items" in top || "rows" in top) {
    raw = top;
  }

  if (!raw) return null;

  const itemsRaw = raw.items ?? raw.rows ?? raw.results;
  if (!Array.isArray(itemsRaw)) return null;

  const items: UserSavedCountRow[] = itemsRaw.map((row) => {
    if (!row || typeof row !== "object") return {};
    const r = row as Record<string, unknown>;
    return {
      ...r,
      user_id: r.user_id ?? r.userId ?? r.id,
      username: typeof r.username === "string" ? r.username : typeof r.name === "string" ? r.name : undefined,
      email: typeof r.email === "string" ? r.email : undefined,
      save_count: num(r, "save_count", "saveCount", "saved_count", "count"),
    };
  });

  const total = num(raw, "total", "total_count", "totalCount") ?? items.length;
  const page = num(raw, "page", "current_page", "currentPage") ?? 1;
  const page_size = num(raw, "page_size", "pageSize", "per_page", "limit") ?? 20;

  return {
    items,
    total,
    page,
    page_size,
  };
}

export async function fetchUserSavedCounts(params: {
  page: number;
  pageSize: number;
  sort: UserSavedCountSort;
}): Promise<PagedUserSavedCounts> {
  const res = await api.get<unknown>(USER_SAVED_COUNTS_ENDPOINT, {
    params: {
      page: params.page,
      page_size: params.pageSize,
      sort: params.sort,
    },
  });
  const parsed = unwrapPagedBody(res.data);
  if (!parsed) {
    throw new Error("Invalid user saved counts response");
  }
  return parsed;
}

export function isUserSavedCountsNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildUserSavedCountsCsv(rows: UserSavedCountRow[]): string {
  const headers = ["user_id", "username", "email", "save_count"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const cells = [
      csvEscape(String(r.user_id ?? "")),
      csvEscape(String(r.username ?? "")),
      csvEscape(String(r.email ?? "")),
      csvEscape(String(r.save_count ?? "")),
    ];
    lines.push(cells.join(","));
  }
  return lines.join("\r\n");
}

export function downloadUserSavedCountsCsv(rows: UserSavedCountRow[], filename: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + buildUserSavedCountsCsv(rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
