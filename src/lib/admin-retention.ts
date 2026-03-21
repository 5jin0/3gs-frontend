import axios from "axios";
import { adminAnalyticsEndpoint } from "@/lib/admin-analytics-paths";
import { api, type ApiSuccessResponse } from "@/lib/api";
import type { AdminPeriod } from "@/lib/admin-period";
import { heatIntensity } from "@/lib/admin-access-cohorts";

export type RetentionGranularity = AdminPeriod;

const RETENTION_ENDPOINT = adminAnalyticsEndpoint("/retention");

export type RetentionGridRow = {
  label: string;
  values: number[];
};

export type RetentionGridData = {
  granularity_label?: string;
  column_labels: string[];
  rows: RetentionGridRow[];
  [key: string]: unknown;
};

type Envelope = ApiSuccessResponse<RetentionGridData>;

function unwrapRetentionBody(body: unknown): RetentionGridData | null {
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
  } else if ("matrix" in top || "rows" in top) {
    payload = top;
  }

  if (!payload) return null;
  return normalizeRetentionGrid(payload);
}

function normalizeRetentionGrid(raw: Record<string, unknown>): RetentionGridData | null {
  const colsRaw = raw.column_labels ?? raw.columns ?? raw.period_labels ?? raw.columnLabels;
  let column_labels = Array.isArray(colsRaw) ? colsRaw.map((c) => String(c)) : [];

  const matrix = raw.matrix ?? raw.cells;
  let rows: RetentionGridRow[] = [];

  if (Array.isArray(matrix) && matrix.length > 0) {
    const rowLabelsRaw = raw.row_labels ?? raw.cohort_labels ?? raw.rowLabels;
    rows = matrix.map((row, i) => {
      const label =
        Array.isArray(rowLabelsRaw) && rowLabelsRaw[i] != null
          ? String(rowLabelsRaw[i])
          : `코호트 ${i + 1}`;
      const values = Array.isArray(row)
        ? row.map((x) => (typeof x === "number" ? x : Number(x))).filter((n) => Number.isFinite(n))
        : [];
      return { label, values };
    });
  } else {
    const rowsRaw = raw.rows ?? raw.cohorts;
    if (!Array.isArray(rowsRaw)) return null;
    for (const item of rowsRaw) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const label = String(o.label ?? o.cohort_label ?? o.name ?? "").trim();
      if (!label) continue;
      const v = o.values ?? o.retention ?? o.data;
      if (!Array.isArray(v)) continue;
      const values = v.map((x) => (typeof x === "number" ? x : Number(x))).filter((n) => Number.isFinite(n));
      if (values.length === 0) continue;
      rows.push({ label, values });
    }
  }

  if (rows.length === 0 && column_labels.length === 0) return null;

  const maxLen = rows.length > 0 ? Math.max(0, ...rows.map((r) => r.values.length)) : 0;

  if (rows.length === 0) {
    if (column_labels.length === 0) return null;
    return {
      ...raw,
      granularity_label: typeof raw.granularity_label === "string" ? raw.granularity_label : undefined,
      column_labels: column_labels.slice(),
      rows: [],
    };
  }

  if (column_labels.length === 0) {
    column_labels = Array.from({ length: maxLen }, (_, i) => `+${i}`);
  } else if (column_labels.length < maxLen) {
    column_labels = [
      ...column_labels,
      ...Array.from({ length: maxLen - column_labels.length }, (_, i) => `+${column_labels.length + i}`),
    ].slice(0, maxLen);
  } else {
    column_labels = column_labels.slice(0, maxLen);
  }

  rows = rows.map((r) => ({
    label: r.label,
    values: column_labels.map((_, i) => {
      const v = r.values[i];
      return typeof v === "number" && Number.isFinite(v) ? v : Number.NaN;
    }),
  }));

  return {
    ...raw,
    granularity_label: typeof raw.granularity_label === "string" ? raw.granularity_label : undefined,
    column_labels,
    rows,
  };
}

export function retentionMatrixMax(data: RetentionGridData): number {
  let m = 0;
  for (const r of data.rows) {
    for (const v of r.values) {
      if (Number.isFinite(v)) m = Math.max(m, v);
    }
  }
  return m;
}

export { heatIntensity };

/** 리텐션 셀: 0~1 비율이면 %, 그 외는 소수 한 자리 %로 표시(백엔드가 퍼센트 포인트를 주는 경우). */
export function formatRetentionCell(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 0 && n <= 1) return `${(n * 100).toFixed(1)}%`;
  return `${n.toFixed(1)}%`;
}

export async function fetchRetentionGrid(
  granularity: RetentionGranularity,
): Promise<RetentionGridData> {
  const res = await api.get<unknown>(RETENTION_ENDPOINT, {
    params: { granularity },
  });
  const parsed = unwrapRetentionBody(res.data);
  if (!parsed) {
    throw new Error("Invalid retention grid response");
  }
  return parsed;
}

export function isRetentionNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
