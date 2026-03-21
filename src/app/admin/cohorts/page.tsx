"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AccessCohortPeriod,
  CohortGroupBy,
  fetchAccessCohorts,
  heatIntensity,
  isAccessCohortsNotFoundError,
  matrixMaxValue,
  type AccessCohortData,
} from "@/lib/admin-access-cohorts";
import { isAdminForbiddenError } from "@/lib/admin";

const PERIODS: { value: AccessCohortPeriod; label: string }[] = [
  { value: "day", label: "일" },
  { value: "week", label: "주" },
  { value: "month", label: "월" },
];

const GROUPS: { value: CohortGroupBy; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "signup_week", label: "가입 주차" },
  { value: "first_visit", label: "첫 방문 기준" },
];

function formatCell(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

function HeatCell({
  value,
  max,
  children,
}: {
  value: number;
  max: number;
  children: React.ReactNode;
}) {
  const t = heatIntensity(value, max);
  return (
    <td className="relative px-3 py-2 text-right text-sm tabular-nums">
      <div
        className="pointer-events-none absolute inset-0 bg-sky-500 dark:bg-sky-400"
        style={{ opacity: 0.06 + t * 0.88 }}
        aria-hidden
      />
      <span className="relative z-[1] text-zinc-900 dark:text-zinc-50">{children}</span>
    </td>
  );
}

export default function AdminCohortsPage() {
  const [period, setPeriod] = useState<AccessCohortPeriod>("week");
  const [groupBy, setGroupBy] = useState<CohortGroupBy>("signup_week");
  const [data, setData] = useState<AccessCohortData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: AccessCohortPeriod, g: CohortGroupBy) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAccessCohorts({ period: p, groupBy: g });
      setData(res);
    } catch (e) {
      if (isAdminForbiddenError(e)) {
        setError("이 보고서는 관리자만 조회할 수 있습니다.");
      } else if (isAccessCohortsNotFoundError(e)) {
        setError(
          "접속·코호트 API가 아직 없거나 경로가 다릅니다. (GET /admin/analytics/access-cohorts)",
        );
      } else {
        setError("데이터를 불러오지 못했습니다.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period, groupBy);
  }, [load, period, groupBy]);

  const maxVal = useMemo(() => (data ? matrixMaxValue(data) : 0), [data]);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            접속·로그인·재접속
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            코호트별 접속·로그인·재접속 흐름을 표와 히트맵으로 봅니다.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            기간
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as AccessCohortPeriod)}
              className="h-10 min-w-[8rem] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {PERIODS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            코호트
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as CohortGroupBy)}
              className="h-10 min-w-[10rem] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {GROUPS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {data?.period_label ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{data.period_label}</p>
      ) : null}

      {loading ? (
        <div
          className="mt-8 h-64 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-100/80 dark:border-zinc-800/70 dark:bg-zinc-900/40"
          aria-busy="true"
        />
      ) : null}

      {error && !loading ? (
        <div
          className="mt-8 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && data && data.rows.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
          표시할 코호트 행이 없습니다.
        </p>
      ) : null}

      {!loading && !error && data && data.rows.length > 0 ? (
        <div className="mt-8 space-y-6">
          <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th
                    scope="col"
                    className="sticky left-0 z-[1] bg-zinc-50/95 px-3 py-3 text-left text-xs font-semibold text-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300"
                  >
                    코호트
                  </th>
                  {data.column_labels.map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                  >
                    <th
                      scope="row"
                      className="sticky left-0 z-[1] bg-white/95 px-3 py-2 text-left font-medium text-zinc-900 dark:bg-zinc-950/95 dark:text-zinc-50"
                    >
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <HeatCell key={`${row.label}-${i}`} value={v} max={maxVal}>
                        {formatCell(v)}
                      </HeatCell>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400"
            role="region"
            aria-label="히트맵 범례"
          >
            <span className="font-medium text-zinc-700 dark:text-zinc-300">범례</span>
            <span>낮음</span>
            <div
              className="h-3 w-40 max-w-full rounded bg-gradient-to-r from-sky-500/[0.08] to-sky-500/[0.94] dark:from-sky-400/[0.08] dark:to-sky-400/[0.94]"
              aria-hidden
            />
            <span>높음 (같은 표 안에서 상대 비교)</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
