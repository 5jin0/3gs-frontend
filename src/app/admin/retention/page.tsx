"use client";

import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPeriodToggle } from "@/components/admin/AdminPeriodToggle";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
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
import { adminAnalyticsNotFoundMessage } from "@/lib/admin-analytics-paths";
import { isAdminForbiddenError } from "@/lib/admin";

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
        setError(adminAnalyticsNotFoundMessage("retention"));
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
      <AdminPageHeader
        title="리텐션"
        titleClassName="text-xl font-semibold tracking-tight text-[#E0E0E0]"
        description="코호트별 기간 경과에 따른 잔존을 그리드로 봅니다."
      >
        <AdminPeriodToggle
          value={granularity}
          onChange={setGranularity}
          ariaLabel="집계 단위"
        />
      </AdminPageHeader>

      {data?.granularity_label ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{data.granularity_label}</p>
      ) : null}

      {loading ? <AdminSkeleton variant="table" /> : null}

      {error && !loading ? <AdminAlert>{error}</AdminAlert> : null}

      {!loading && !error && data && data.rows.length === 0 ? (
        <AdminEmptyState message="표시할 리텐션 행이 없습니다." />
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
