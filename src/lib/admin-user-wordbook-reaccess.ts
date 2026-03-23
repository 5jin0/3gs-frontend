import axios from "axios";
import { adminAnalyticsEndpoint } from "@/lib/admin-analytics-paths";
import { api, type ApiSuccessResponse } from "@/lib/api";
import type { AdminPeriod } from "@/lib/admin-period";

const USER_WORDBOOK_REACCESS_ENDPOINT = adminAnalyticsEndpoint("/user-wordbook-reaccess");

export type UserWordbookReaccessSort =
  | "wordbook_view_desc"
  | "wordbook_view_asc"
  | "reaccess_rate_desc"
  | "reaccess_rate_asc"
  | "username_asc"
  | "username_desc";

export type UserWordbookReaccessRow = {
  user_id?: string | number;
  username?: string;
  email?: string;
  wordbook_view_count?: number;
  reaccess_count?: number;
  reaccess_rate?: number | null;
  [key: string]: unknown;
};

export type PagedUserWordbookReaccess = {
  items: UserWordbookReaccessRow[];
  total: number;
  page: number;
  page_size: number;
};

type PagedEnvelope = ApiSuccessResponse<PagedUserWordbookReaccess>;

function num(o: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function nullableNum(o: Record<string, unknown>, ...keys: string[]): number | null | undefined {
  for (const key of keys) {
    const v = o[key];
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function unwrapPagedBody(body: unknown): PagedUserWordbookReaccess | null {
  if (!body || typeof body !== "object") return null;

  const top = body as Record<string, unknown>;
  if ("success" in top && top.success === false) return null;

  let raw: Record<string, unknown> | null = null;
  if (
    "success" in top &&
    (top as PagedEnvelope).success === true &&
    "data" in top &&
    (top as PagedEnvelope).data &&
    typeof (top as PagedEnvelope).data === "object" &&
    !Array.isArray((top as PagedEnvelope).data)
  ) {
    raw = (top as PagedEnvelope).data as Record<string, unknown>;
  } else if ("data" in top && top.data && typeof top.data === "object" && !Array.isArray(top.data)) {
    raw = top.data as Record<string, unknown>;
  } else if ("items" in top || "rows" in top) {
    raw = top;
  }

  if (!raw) return null;

  const itemsRaw = raw.items ?? raw.rows ?? raw.results;
  if (!Array.isArray(itemsRaw)) return null;

  const items: UserWordbookReaccessRow[] = itemsRaw.map((row) => {
    if (!row || typeof row !== "object") return {};
    const r = row as Record<string, unknown>;
    return {
      ...r,
      user_id: r.user_id ?? r.userId ?? r.id,
      username: typeof r.username === "string" ? r.username : typeof r.name === "string" ? r.name : undefined,
      email: typeof r.email === "string" ? r.email : undefined,
      wordbook_view_count: num(r, "wordbook_view_count", "wordbookViewCount"),
      reaccess_count: num(r, "reaccess_count", "reaccessCount"),
      reaccess_rate: nullableNum(r, "reaccess_rate", "reaccessRate"),
    };
  });

  const total = num(raw, "total", "total_count", "totalCount") ?? items.length;
  const page = num(raw, "page", "current_page", "currentPage") ?? 1;
  const page_size = num(raw, "page_size", "pageSize", "per_page", "limit") ?? 20;

  return { items, total, page, page_size };
}

export async function fetchUserWordbookReaccess(params: {
  period: AdminPeriod;
  page: number;
  pageSize: number;
  sort: UserWordbookReaccessSort;
}): Promise<PagedUserWordbookReaccess> {
  const res = await api.get<unknown>(USER_WORDBOOK_REACCESS_ENDPOINT, {
    params: {
      period: params.period,
      page: params.page,
      page_size: params.pageSize,
      sort: params.sort,
    },
  });

  const parsed = unwrapPagedBody(res.data);
  if (!parsed) throw new Error("Invalid user wordbook reaccess response");
  return parsed;
}

export function formatReaccessRate(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  const clamped = Math.min(1, Math.max(0, rate));
  return `${(clamped * 100).toFixed(1)}%`;
}

export function isUserWordbookReaccessNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildUserWordbookReaccessCsv(rows: UserWordbookReaccessRow[]): string {
  const headers = [
    "user_id",
    "username",
    "email",
    "wordbook_view_count",
    "reaccess_count",
    "reaccess_rate_percent",
  ];
  const lines = [headers.join(",")];

  for (const row of rows) {
    const cells = [
      csvEscape(String(row.user_id ?? "")),
      csvEscape(String(row.username ?? "")),
      csvEscape(String(row.email ?? "")),
      csvEscape(String(row.wordbook_view_count ?? "")),
      csvEscape(String(row.reaccess_count ?? "")),
      csvEscape(formatReaccessRate(row.reaccess_rate)),
    ];
    lines.push(cells.join(","));
  }
  return lines.join("\r\n");
}

export function downloadUserWordbookReaccessCsv(
  rows: UserWordbookReaccessRow[],
  filename: string,
): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + buildUserWordbookReaccessCsv(rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
