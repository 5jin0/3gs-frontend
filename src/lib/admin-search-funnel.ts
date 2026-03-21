import axios from "axios";
import { adminAnalyticsEndpoint } from "@/lib/admin-analytics-paths";
import { api, type ApiSuccessResponse } from "@/lib/api";
import type { AdminPeriod } from "@/lib/admin-period";

const SEARCH_FUNNEL_ENDPOINT = adminAnalyticsEndpoint("/search-funnel");

export type SearchFunnelPeriod = AdminPeriod;

/** Normalized rates in 0–1 or 0–100; backend may use snake_case or camelCase. */
export type SearchFunnelMetrics = {
  start_rate?: number;
  click_rate?: number;
  autocomplete_rate?: number;
  failure_rate?: number;
  [key: string]: unknown;
};

/**
 * 지표 정의 — 백엔드 문서·응답 메시지와 동일하게 유지하세요.
 */
export const SEARCH_FUNNEL_TOOLTIPS: Record<
  "start_rate" | "click_rate" | "autocomplete_rate" | "failure_rate",
  string
> = {
  start_rate:
    "검색창에 포커스·진입한 세션 중, 실제 검색을 수행한 세션의 비율입니다.",
  click_rate:
    "검색 결과 목록에 노출된 항목 대비, 사용자가 항목을 클릭한 비율입니다.",
  autocomplete_rate:
    "검색창 입력 중 자동완성 제안이 노출된 경우 대비, 제안을 선택한 비율입니다.",
  failure_rate:
    "검색 요청 중 오류(HTTP 오류·타임아웃 등)로 실패한 비율입니다.",
};

type FunnelEnvelope = ApiSuccessResponse<SearchFunnelMetrics>;

function unwrapFunnelBody(body: unknown): SearchFunnelMetrics | null {
  if (!body || typeof body !== "object") return null;

  const top = body as Record<string, unknown>;
  if ("success" in top && top.success === false) return null;

  if (
    "success" in top &&
    (top as FunnelEnvelope).success === true &&
    "data" in top &&
    (top as FunnelEnvelope).data != null &&
    typeof (top as FunnelEnvelope).data === "object" &&
    !Array.isArray((top as FunnelEnvelope).data)
  ) {
    return normalizeFunnelMetrics((top as FunnelEnvelope).data as Record<string, unknown>);
  }

  if ("data" in top && top.data != null && typeof top.data === "object" && !Array.isArray(top.data)) {
    return normalizeFunnelMetrics(top.data as Record<string, unknown>);
  }

  if ("start_rate" in top || "click_rate" in top) {
    return normalizeFunnelMetrics(top);
  }

  return null;
}

function pickRate(
  raw: Record<string, unknown>,
  snake: string,
  camel: string,
): number | undefined {
  const a = raw[snake];
  const b = raw[camel];
  const v = a !== undefined && a !== null ? a : b;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizeFunnelMetrics(raw: Record<string, unknown>): SearchFunnelMetrics {
  return {
    ...raw,
    start_rate: pickRate(raw, "start_rate", "startRate"),
    click_rate: pickRate(raw, "click_rate", "clickRate"),
    autocomplete_rate: pickRate(raw, "autocomplete_rate", "autocompleteRate"),
    failure_rate: pickRate(raw, "failure_rate", "failureRate"),
  };
}

/** Percentage string for display. Values in (0, 1] treated as 비율, 그 외는 이미 퍼센트 값으로 간주. */
export function formatFunnelRate(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const pct = normalizeFunnelRatePercent(value).value;
  return `${pct.toFixed(1)}%`;
}

export function normalizeFunnelRatePercent(value: number): { value: number; clamped: boolean } {
  const raw = value > 0 && value <= 1 ? value * 100 : value;
  const clamped = Math.min(100, Math.max(0, raw));
  return { value: clamped, clamped: clamped !== raw };
}

export async function fetchSearchFunnel(
  period: SearchFunnelPeriod,
): Promise<SearchFunnelMetrics> {
  const res = await api.get<unknown>(SEARCH_FUNNEL_ENDPOINT, {
    params: { period },
  });
  const parsed = unwrapFunnelBody(res.data);
  if (!parsed) {
    throw new Error("Invalid search funnel response");
  }
  return parsed;
}

export function isSearchFunnelNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
