"use client";

import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminInfoTip } from "@/components/admin/AdminInfoTip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPeriodToggle } from "@/components/admin/AdminPeriodToggle";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useCallback, useEffect, useState } from "react";
import { adminAnalyticsNotFoundMessage } from "@/lib/admin-analytics-paths";
import {
  fetchSearchFunnel,
  formatFunnelRate,
  isSearchFunnelNotFoundError,
  SEARCH_FUNNEL_TOOLTIPS,
  type SearchFunnelMetrics,
  type SearchFunnelPeriod,
} from "@/lib/admin-search-funnel";
import { isAdminForbiddenError } from "@/lib/admin";

const METRICS: {
  key: keyof Pick<
    SearchFunnelMetrics,
    "start_rate" | "click_rate" | "autocomplete_rate"
  >;
  label: string;
}[] = [
  { key: "start_rate", label: "시작률" },
  { key: "click_rate", label: "클릭률" },
  { key: "autocomplete_rate", label: "자동완성" },
];

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
        setError(adminAnalyticsNotFoundMessage("searchFunnel"));
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
      <AdminPageHeader
        title="검색 퍼널"
        titleClassName="text-xl font-semibold tracking-tight text-[#E0E0E0]"
        description="검색 시작·클릭·자동완성 비율을 기간별로 확인합니다."
      >
        <AdminPeriodToggle value={period} onChange={setPeriod} />
      </AdminPageHeader>

      {loading ? <AdminSkeleton variant="cards" /> : null}

      {error && !loading ? <AdminAlert>{error}</AdminAlert> : null}

      {!loading && !error && data ? (
        <>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METRICS.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60"
              >
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <span>{label}</span>
                  <AdminInfoTip text={SEARCH_FUNNEL_TOOLTIPS[key]} />
                </dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatFunnelRate(data[key] as number | undefined)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}
    </>
  );
}
