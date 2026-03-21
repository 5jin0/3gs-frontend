import axios from "axios";
import { adminAnalyticsEndpoint } from "@/lib/admin-analytics-paths";
import { api, type ApiSuccessResponse } from "@/lib/api";
import type { AdminPeriod } from "@/lib/admin-period";

export type SearchUxPeriod = AdminPeriod;

const SEARCH_UX_ENDPOINT = adminAnalyticsEndpoint("/search-ux");

/** 백엔드와 동일한 문구로 유지하세요. */
export const COGNITIVE_LOAD_DEFINITION =
  "검색 결과를 이해하고 다음 행동을 결정하기까지 사용자에게 요구되는 인지적 부담을 0~100 지수로 요약한 값입니다. 산출 방식은 백엔드 정의와 동일합니다.";

/** 표본이 이 값 미만이면 ‘표본 부족’ 안내를 띄웁니다. API가 sample_sufficient를 주면 그쪽을 우선합니다. */
export const DEFAULT_MIN_SAMPLE_SIZE = 30;

export type SearchUxMetrics = {
  /** 검색 요청~응답 지연 (ms) */
  latency_avg_ms?: number;
  latency_p50_ms?: number;
  latency_p95_ms?: number;
  latency_p99_ms?: number;
  /** 세션/검색 중 이탈 비율 (0~1 또는 0~100) */
  abandonment_rate?: number;
  churn_rate?: number;
  /** 인지 부담 지수 (보통 0~100) */
  cognitive_load_index?: number;
  cognitive_load_avg?: number;
  /** 표본 수 */
  sample_size?: number;
  /** false면 표본 부족으로 간주 */
  sample_sufficient?: boolean;
  [key: string]: unknown;
};

type UxEnvelope = ApiSuccessResponse<SearchUxMetrics>;

function unwrapUxBody(body: unknown): SearchUxMetrics | null {
  if (!body || typeof body !== "object") return null;

  const top = body as Record<string, unknown>;
  if ("success" in top && top.success === false) return null;

  if (
    "success" in top &&
    (top as UxEnvelope).success === true &&
    "data" in top &&
    (top as UxEnvelope).data != null &&
    typeof (top as UxEnvelope).data === "object" &&
    !Array.isArray((top as UxEnvelope).data)
  ) {
    return normalizeUxMetrics((top as UxEnvelope).data as Record<string, unknown>);
  }

  if ("data" in top && top.data != null && typeof top.data === "object" && !Array.isArray(top.data)) {
    return normalizeUxMetrics(top.data as Record<string, unknown>);
  }

  if ("latency_avg_ms" in top || "cognitive_load_index" in top) {
    return normalizeUxMetrics(top);
  }

  return null;
}

function num(raw: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function normalizeUxMetrics(raw: Record<string, unknown>): SearchUxMetrics {
  const sample_size = num(raw, "sample_size", "sampleSize", "n");
  const sample_sufficient =
    typeof raw.sample_sufficient === "boolean"
      ? raw.sample_sufficient
      : typeof raw.sampleSufficient === "boolean"
        ? raw.sampleSufficient
        : undefined;

  return {
    ...raw,
    latency_avg_ms: num(raw, "latency_avg_ms", "latencyAvgMs", "latency_avg"),
    latency_p50_ms: num(raw, "latency_p50_ms", "latencyP50Ms"),
    latency_p95_ms: num(raw, "latency_p95_ms", "latencyP95Ms"),
    latency_p99_ms: num(raw, "latency_p99_ms", "latencyP99Ms"),
    abandonment_rate: num(raw, "abandonment_rate", "abandonmentRate"),
    churn_rate: num(raw, "churn_rate", "churnRate"),
    cognitive_load_index: num(raw, "cognitive_load_index", "cognitiveLoadIndex"),
    cognitive_load_avg: num(raw, "cognitive_load_avg", "cognitiveLoadAvg"),
    sample_size,
    sample_sufficient,
  };
}

export function formatMilliseconds(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

/** 0~1 또는 0~100 비율을 퍼센트 문자열로 */
export function formatUxRate(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const pct = value > 0 && value <= 1 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

export function formatCognitiveLoad(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}`;
}

export function isSampleInsufficient(data: SearchUxMetrics): boolean {
  if (data.sample_sufficient === false) return true;
  if (data.sample_sufficient === true) return false;
  const n = data.sample_size;
  if (n == null || !Number.isFinite(n)) return false;
  return n < DEFAULT_MIN_SAMPLE_SIZE;
}

export async function fetchSearchUx(period: SearchUxPeriod): Promise<SearchUxMetrics> {
  const res = await api.get<unknown>(SEARCH_UX_ENDPOINT, { params: { period } });
  const parsed = unwrapUxBody(res.data);
  if (!parsed) {
    throw new Error("Invalid search UX response");
  }
  return parsed;
}

export function isSearchUxNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
