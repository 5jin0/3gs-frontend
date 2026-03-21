"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchSearchFunnel,
  formatFunnelRate,
  isSearchFunnelNotFoundError,
  SEARCH_FUNNEL_TOOLTIPS,
  type SearchFunnelMetrics,
  type SearchFunnelPeriod,
} from "@/lib/admin-search-funnel";
import { isAdminForbiddenError } from "@/lib/admin";

const PERIODS: { value: SearchFunnelPeriod; label: string }[] = [
  { value: "day", label: "일" },
  { value: "week", label: "주" },
  { value: "month", label: "월" },
];

const METRICS: {
  key: keyof Pick<
    SearchFunnelMetrics,
    "start_rate" | "click_rate" | "autocomplete_rate" | "failure_rate"
  >;
  label: string;
}[] = [
  { key: "start_rate", label: "시작률" },
  { key: "click_rate", label: "클릭률" },
  { key: "autocomplete_rate", label: "자동완성" },
  { key: "failure_rate", label: "실패율" },
];

function InfoTip({ text }: { text: string }) {
  return (
    <span className="inline-flex shrink-0" title={text}>
      <span className="sr-only">{text}</span>
      <span
        className="inline-flex size-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
        aria-hidden
      >
        ?
      </span>
    </span>
  );
}

export default function AdminSearchFunnelPage() {
  const [period, setPeriod] = useState<SearchFunnelPeriod>("day");
  const [data, setData] = useState<SearchFunnelMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: SearchFunnelPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSearchFunnel(p);
      setData(res);
    } catch (e) {
      if (isAdminForbiddenError(e)) {
        setError("이 지표는 관리자만 조회할 수 있습니다.");
      } else if (isSearchFunnelNotFoundError(e)) {
        setError(
          "검색 퍼널 API가 아직 없거나 경로가 다릅니다. (GET /admin/analytics/search-funnel?period=…)",
        );
      } else {
        setError("검색 퍼널 데이터를 불러오지 못했습니다.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            검색 퍼널
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            검색 시작·클릭·자동완성·실패 비율을 기간별로 확인합니다.
          </p>
        </div>
        <div
          className="inline-flex rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-1 dark:border-zinc-800/70 dark:bg-zinc-900/40"
          role="group"
          aria-label="집계 기간"
        >
          {PERIODS.map(({ value, label }) => {
            const active = period === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                ].join(" ")}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {METRICS.map(({ key }) => (
            <div
              key={key}
              className="h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-100/80 dark:border-zinc-800/70 dark:bg-zinc-900/40"
            />
          ))}
        </div>
      ) : null}

      {error && !loading ? (
        <div
          className="mt-8 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && data ? (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60"
            >
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <span>{label}</span>
                <InfoTip text={SEARCH_FUNNEL_TOOLTIPS[key]} />
              </dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatFunnelRate(data[key] as number | undefined)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
}
