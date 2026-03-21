import axios from "axios";
import { api, type ApiSuccessResponse } from "@/lib/api";

const ACCESS_COHORTS_ENDPOINT = "/admin/analytics/access-cohorts";

export type AccessCohortPeriod = "day" | "week" | "month";

/** 코호트 묶음 기준 — 백엔드 `group_by`와 맞출 것 */
export type CohortGroupBy = "signup_week" | "first_visit" | "all";

export type AccessCohortRow = {
  label: string;
  values: number[];
};

export type AccessCohortData = {
  period_label?: string;
  column_labels: string[];
  rows: AccessCohortRow[];
  [key: string]: unknown;
};

type Envelope = ApiSuccessResponse<AccessCohortData>;

function unwrapAccessCohortsBody(body: unknown): AccessCohortData | null {
  if (!body || typeof body !== "object") return null;

  const top = body as Record<string, unknown>;
  if ("success" in top && top.success === false) return null;

  let payload: Record<string, unknown> | null = null;

  if (
    "success" in top &&
    (top as Envelope).success === true &&
    "data" in top &&
    (top as Envelope).data != null &&
    typeof (top as Envelope).data === "object" &&
    !Array.isArray((top as Envelope).data)
  ) {
    payload = (top as Envelope).data as Record<string, unknown>;
  } else if ("data" in top && top.data != null && typeof top.data === "object" && !Array.isArray(top.data)) {
    payload = top.data as Record<string, unknown>;
  } else if ("column_labels" in top || "rows" in top) {
    payload = top;
  }

  if (!payload) return null;
  return normalizeAccessCohortData(payload);
}

function normalizeAccessCohortData(raw: Record<string, unknown>): AccessCohortData | null {
  const colsRaw = raw.column_labels ?? raw.columns ?? raw.columnLabels;
  const column_labels = Array.isArray(colsRaw) ? colsRaw.map((c) => String(c)) : [];

  const rowsRaw = raw.rows ?? raw.cohorts ?? raw.data_rows;
  if (!Array.isArray(rowsRaw)) return null;

  const rows: AccessCohortRow[] = [];

  for (const item of rowsRaw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = String(o.label ?? o.cohort_label ?? o.cohort ?? o.name ?? "").trim();
    if (!label) continue;

    let values: number[] = [];
    const v = o.values ?? o.metrics ?? o.counts ?? o.data;
    if (Array.isArray(v)) {
      values = v.map((x) => (typeof x === "number" ? x : Number(x))).filter((n) => Number.isFinite(n));
    }

    if (values.length === 0) {
      const a = num(o, "visits", "visit_count", "sessions");
      const b = num(o, "logins", "login_count");
      const c = num(o, "return_visits", "returns", "revisit_count");
      if (a != null || b != null || c != null) {
        values = [a ?? 0, b ?? 0, c ?? 0];
      }
    }

    if (values.length === 0) continue;

    if (column_labels.length > 0 && values.length !== column_labels.length) {
      const n = Math.min(column_labels.length, values.length);
      values = values.slice(0, n);
    }

    rows.push({ label, values });
  }

  if (rows.length === 0) {
    if (column_labels.length === 0) return null;
    return {
      ...raw,
      period_label: typeof raw.period_label === "string" ? raw.period_label : undefined,
      column_labels: column_labels.slice(),
      rows: [],
    };
  }

  const maxLen = Math.max(0, ...rows.map((r) => r.values.length));
  let finalColumns: string[];
  if (column_labels.length >= maxLen && maxLen > 0) {
    finalColumns = column_labels.slice(0, maxLen);
  } else if (column_labels.length > 0 && maxLen > 0) {
    finalColumns = [
      ...column_labels,
      ...Array.from({ length: maxLen - column_labels.length }, (_, i) => `열 ${column_labels.length + i + 1}`),
    ].slice(0, maxLen);
  } else if (maxLen === 3) {
    finalColumns = ["접속", "로그인", "재접속"];
  } else {
    finalColumns = Array.from({ length: maxLen }, (_, i) => `열 ${i + 1}`);
  }

  return {
    ...raw,
    period_label: typeof raw.period_label === "string" ? raw.period_label : undefined,
    column_labels: finalColumns,
    rows: rows.map((r) => ({
      ...r,
      values: r.values.slice(0, finalColumns.length),
    })),
  };
}

function num(o: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

export function matrixMaxValue(data: AccessCohortData): number {
  let m = 0;
  for (const r of data.rows) {
    for (const v of r.values) {
      if (Number.isFinite(v)) m = Math.max(m, v);
    }
  }
  return m;
}

export function heatIntensity(value: number, max: number): number {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

export async function fetchAccessCohorts(params: {
  period: AccessCohortPeriod;
  groupBy: CohortGroupBy;
}): Promise<AccessCohortData> {
  const res = await api.get<unknown>(ACCESS_COHORTS_ENDPOINT, {
    params: {
      period: params.period,
      group_by: params.groupBy,
    },
  });
  const parsed = unwrapAccessCohortsBody(res.data);
  if (!parsed) {
    throw new Error("Invalid access cohorts response");
  }
  return parsed;
}

export function isAccessCohortsNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
