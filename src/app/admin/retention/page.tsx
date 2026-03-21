"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchRetentionGrid,
  formatRetentionCell,
  heatIntensity,
  isRetentionNotFoundError,
  retentionMatrixMax,
  type RetentionGranularity,
  type RetentionGridData,
} from "@/lib/admin-retention";
import { isAdminForbiddenError } from "@/lib/admin";

const GRANULARITIES: { value: RetentionGranularity; label: string }[] = [
  { value: "day", label: "일" },
  { value: "week", label: "주" },
  { value: "month", label: "월" },
];

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
        className="pointer-events-none absolute inset-0 bg-violet-500 dark:bg-violet-400"
        style={{ opacity: 0.06 + t * 0.88 }}
        aria-hidden
      />
      <span className="relative z-[1] text-zinc-900 dark:text-zinc-50">{children}</span>
    </td>
  );
}

export default function AdminRetentionPage() {
  const [granularity, setGranularity] = useState<RetentionGranularity>("week");
  const [data, setData] = useState<RetentionGridData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (g: RetentionGranularity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRetentionGrid(g);
      setData(res);
    } catch (e) {
      if (isAdminForbiddenError(e)) {
        setError("이 보고서는 관리자만 조회할 수 있습니다.");
      } else if (isRetentionNotFoundError(e)) {
        setError(
          "리텐션 API가 아직 없거나 경로가 다릅니다. (GET /admin/analytics/retention?granularity=…)",
        );
      } else {
        setError("리텐션 데이터를 불러오지 못했습니다.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(granularity);
  }, [load, granularity]);

  const maxVal = useMemo(() => (data ? retentionMatrixMax(data) : 0), [data]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            리텐션
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            코호트별 기간 경과에 따른 잔존을 그리드로 봅니다. 셀 단위는 백엔드 정의(비율·퍼센트 포인트 등)에
            맞춰 표시됩니다.
          </p>
        </div>
        <div
          className="inline-flex rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-1 dark:border-zinc-800/70 dark:bg-zinc-900/40"
          role="group"
          aria-label="집계 단위"
        >
          {GRANULARITIES.map(({ value, label }) => {
            const active = granularity === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setGranularity(value)}
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

      {data?.granularity_label ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{data.granularity_label}</p>
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
          표시할 리텐션 행이 없습니다.
        </p>
      ) : null}

      {!loading && !error && data && data.rows.length > 0 ? (
        <div className="mt-8 space-y-6">
          <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
            <table className="w-full min-w-[520px] border-collapse text-sm">
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
                        {formatRetentionCell(v)}
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
            aria-label="색상 스케일"
          >
            <span className="font-medium text-zinc-700 dark:text-zinc-300">색상</span>
            <span>낮음</span>
            <div
              className="h-3 w-40 max-w-full rounded bg-gradient-to-r from-violet-500/[0.08] to-violet-500/[0.94] dark:from-violet-400/[0.08] dark:to-violet-400/[0.94]"
              aria-hidden
            />
            <span>높음 (표 안 최댓값 기준)</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
