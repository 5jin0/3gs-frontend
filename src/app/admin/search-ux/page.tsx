"use client";

import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminInfoTip } from "@/components/admin/AdminInfoTip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPeriodToggle } from "@/components/admin/AdminPeriodToggle";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COGNITIVE_LOAD_DEFINITION,
  DEFAULT_MIN_SAMPLE_SIZE,
  fetchSearchUx,
  formatCognitiveLoad,
  formatMilliseconds,
  formatUxRate,
  isSampleInsufficient,
  isSearchUxNotFoundError,
  type SearchUxMetrics,
  type SearchUxPeriod,
} from "@/lib/admin-search-ux";
import { isAdminForbiddenError } from "@/lib/admin";

const BAR_MAX_PX = 112;

function LatencyBars({ data }: { data: SearchUxMetrics }) {
  const points = useMemo(() => {
    const rows = [
      { key: "p50", label: "p50", v: data.latency_p50_ms },
      { key: "p95", label: "p95", v: data.latency_p95_ms },
      { key: "p99", label: "p99", v: data.latency_p99_ms },
      { key: "avg", label: "평균", v: data.latency_avg_ms },
    ].filter((r): r is typeof r & { v: number } => typeof r.v === "number" && Number.isFinite(r.v));
    const max = Math.max(...rows.map((r) => r.v), 1);
    return rows.map((r) => ({ ...r, pct: Math.min(100, (r.v / max) * 100) }));
  }, [data]);

  if (points.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">지연 데이터가 없습니다.</p>
    );
  }

  return (
    <div className="flex items-end gap-3 sm:gap-4" role="img" aria-label="지연 분포 막대">
      {points.map(({ key, label, v, pct }) => {
        const h = Math.max(4, (pct / 100) * BAR_MAX_PX);
        return (
          <div key={key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-zinc-800/80 dark:bg-zinc-200/80"
              style={{ height: `${h}px` }}
            />
            <div className="text-center">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</div>
              <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatMilliseconds(v)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminSearchUxPage() {
  const [period, setPeriod] = useState<SearchUxPeriod>("day");
  const [data, setData] = useState<SearchUxMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: SearchUxPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSearchUx(p);
      setData(res);
    } catch (e) {
      if (isAdminForbiddenError(e)) {
        setError("이 지표는 관리자만 조회할 수 있습니다.");
      } else if (isSearchUxNotFoundError(e)) {
        setError(
          "검색 경험 API가 아직 없거나 경로가 다릅니다. (GET /admin/analytics/search-ux?period=…)",
        );
      } else {
        setError("검색 경험 데이터를 불러오지 못했습니다.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  const sampleWarning = data && isSampleInsufficient(data);
  const sampleNote =
    data?.sample_size != null
      ? `현재 표본 수: ${data.sample_size} (권장 ${DEFAULT_MIN_SAMPLE_SIZE} 이상)`
      : `권장 최소 표본: ${DEFAULT_MIN_SAMPLE_SIZE}`;

  return (
    <>
      <AdminPageHeader
        title="검색 지연·이탈·인지부담"
        description="지연 분포, 이탈 비율, 인지 부담 지수를 기간별로 확인합니다."
      >
        <AdminPeriodToggle value={period} onChange={setPeriod} />
      </AdminPageHeader>

      {loading ? <AdminSkeleton variant="stack" /> : null}

      {error && !loading ? <AdminAlert>{error}</AdminAlert> : null}

      {!loading && !error && data ? (
        <div className="mt-8 space-y-8">
          {sampleWarning ? (
            <AdminAlert variant="info" role="status" className="mt-0">
              <p className="font-medium">표본이 부족합니다</p>
              <p className="mt-1 opacity-90">{sampleNote}</p>
              <p className="mt-2 opacity-80">
                아래 수치는 참고용이며, 표본이 쌓이면 안내가 사라질 수 있습니다.
              </p>
            </AdminAlert>
          ) : null}

          <section aria-labelledby="latency-heading">
            <h2
              id="latency-heading"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              검색 지연
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              응답 시간 분포(밀리초). 막대 높이는 상대 비교용입니다.
            </p>
            <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-5 dark:border-zinc-800/70 dark:bg-zinc-950/60">
              <LatencyBars data={data} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["latency_p50_ms", "p50"],
                  ["latency_p95_ms", "p95"],
                  ["latency_p99_ms", "p99"],
                  ["latency_avg_ms", "평균"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800/80 dark:bg-zinc-900/30"
                >
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
                  <dd className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatMilliseconds(data[key] as number | undefined)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="churn-heading">
            <h2 id="churn-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              이탈
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {data.abandonment_rate != null && Number.isFinite(data.abandonment_rate) ? (
                <div className="rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 dark:border-zinc-800/70 dark:bg-zinc-950/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    이탈률 (abandonment)
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatUxRate(data.abandonment_rate)}
                  </p>
                </div>
              ) : null}
              {data.churn_rate != null && Number.isFinite(data.churn_rate) ? (
                <div className="rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 dark:border-zinc-800/70 dark:bg-zinc-950/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    이탈률 (churn)
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatUxRate(data.churn_rate)}
                  </p>
                </div>
              ) : null}
              {data.abandonment_rate == null && data.churn_rate == null ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  이탈 지표가 없습니다. API에 <code className="text-[11px]">abandonment_rate</code> 또는{" "}
                  <code className="text-[11px]">churn_rate</code>를 내려 주세요.
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="cognitive-heading">
            <h2
              id="cognitive-heading"
              className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              인지 부담
              <AdminInfoTip text={COGNITIVE_LOAD_DEFINITION} />
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {COGNITIVE_LOAD_DEFINITION}
            </p>
            <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 dark:border-zinc-800/70 dark:bg-zinc-950/60">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                지수 (평균 대체 가능)
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatCognitiveLoad(
                  data.cognitive_load_index ?? data.cognitive_load_avg,
                )}
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
