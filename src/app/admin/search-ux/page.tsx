"use client";

import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminInfoTip } from "@/components/admin/AdminInfoTip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPeriodToggle } from "@/components/admin/AdminPeriodToggle";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useCallback, useEffect, useState } from "react";
import { adminAnalyticsNotFoundMessage } from "@/lib/admin-analytics-paths";
import {
  COGNITIVE_LOAD_DEFINITION,
  fetchSearchUx,
  formatCognitiveLoad,
  formatUxRate,
  isSearchUxNotFoundError,
  type SearchUxMetrics,
  type SearchUxPeriod,
} from "@/lib/admin-search-ux";
import { isAdminForbiddenError } from "@/lib/admin";

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
        setError(adminAnalyticsNotFoundMessage("searchUx"));
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

  return (
    <>
      <AdminPageHeader
        title="검색 이탈·인지부담"
        titleClassName="text-xl font-semibold tracking-tight text-[#E0E0E0]"
        description="이탈 비율, 인지 부담 지수를 기간별로 확인합니다."
      >
        <AdminPeriodToggle value={period} onChange={setPeriod} />
      </AdminPageHeader>

      {loading ? <AdminSkeleton variant="stack" /> : null}

      {error && !loading ? <AdminAlert>{error}</AdminAlert> : null}

      {!loading && !error && data ? (
        <div className="mt-8 space-y-8">
          <section aria-labelledby="churn-heading">
            <h2 id="churn-heading" className="text-sm font-semibold text-[#E0E0E0]">
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
              {data.abandonment_rate == null ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  이탈 지표가 없습니다. API에 <code className="text-[11px]">abandonment_rate</code>를 내려 주세요.
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="cognitive-heading">
            <h2
              id="cognitive-heading"
              className="flex items-center gap-2 text-sm font-semibold text-[#E0E0E0]"
            >
              인지 부담
              <AdminInfoTip text={COGNITIVE_LOAD_DEFINITION} />
            </h2>
            <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 dark:border-zinc-800/70 dark:bg-zinc-950/60">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                인지부담지수 (동일 용어 반복 검색 사용자 비율)
              </p>
              {(() => {
                const display = formatCognitiveLoad(data.cognitive_load_index);
                return (
                  <>
                    <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {display}
                    </p>
                  </>
                );
              })()}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
