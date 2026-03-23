"use client";

import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminInfoTip } from "@/components/admin/AdminInfoTip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPeriodToggle } from "@/components/admin/AdminPeriodToggle";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadUserWordbookReaccessCsv,
  fetchUserWordbookReaccess,
  formatReaccessRate,
  isUserWordbookReaccessNotFoundError,
  type UserWordbookReaccessRow,
  type UserWordbookReaccessSort,
} from "@/lib/admin-user-wordbook-reaccess";
import { adminAnalyticsNotFoundMessage } from "@/lib/admin-analytics-paths";
import { isAdminForbiddenError } from "@/lib/admin";
import type { AdminPeriod } from "@/lib/admin-period";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const REACCESS_RATE_TOOLTIP =
  "집계 기간 내 단어장 조회(wordbook_view) 이후 같은 기간에 다시 로그인(login_success)한 비율";

const SORT_OPTIONS: { value: UserWordbookReaccessSort; label: string }[] = [
  { value: "wordbook_view_desc", label: "단어장 조회 횟수 많은 순" },
  { value: "wordbook_view_asc", label: "단어장 조회 횟수 적은 순" },
  { value: "reaccess_rate_desc", label: "재접속률 높은 순" },
  { value: "reaccess_rate_asc", label: "재접속률 낮은 순" },
  { value: "username_asc", label: "사용자명 오름차순" },
  { value: "username_desc", label: "사용자명 내림차순" },
];

export default function AdminUserWordbookReaccessPage() {
  const [period, setPeriod] = useState<AdminPeriod>("week");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<UserWordbookReaccessSort>("wordbook_view_desc");

  const [rows, setRows] = useState<UserWordbookReaccessRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserWordbookReaccess({
        period,
        page,
        pageSize,
        sort,
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (e) {
      if (isAdminForbiddenError(e)) {
        setError("이 목록은 관리자만 조회할 수 있습니다.");
      } else if (isUserWordbookReaccessNotFoundError(e)) {
        setError(adminAnalyticsNotFoundMessage("userWordbookReaccess"));
      } else {
        setError("유저별 단어장 조회/재접속 데이터를 불러오지 못했습니다.");
      }
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [period, page, pageSize, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize) || 1),
    [total, pageSize],
  );

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadUserWordbookReaccessCsv(rows, `user-wordbook-reaccess-p${page}-${stamp}.csv`);
  }

  return (
    <>
      <AdminPageHeader
        title="유저별 단어장 조회/재접속"
        titleClassName="text-xl font-semibold tracking-tight text-[#E0E0E0]"
        description="사용자별 단어장 조회와 재접속 지표를 기간·정렬·페이지 단위로 확인합니다."
      >
        <div className="flex flex-wrap items-center gap-3">
          <AdminPeriodToggle
            value={period}
            onChange={(next) => {
              setPeriod(next);
              setPage(1);
            }}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            정렬
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as UserWordbookReaccessSort);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            페이지당
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || rows.length === 0}
            className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            CSV 내보내기 (현재 페이지)
          </button>
        </div>
      </AdminPageHeader>

      {loading ? <AdminSkeleton variant="block" /> : null}

      {error && !loading ? <AdminAlert>{error}</AdminAlert> : null}

      {!loading && !error ? (
        <>
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            총 {total.toLocaleString("ko-KR")}건 · {page} / {totalPages} 페이지
          </p>

          {rows.length === 0 ? (
            <AdminEmptyState message="데이터가 없습니다." />
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      사용자 ID
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      사용자명
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      이메일
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      단어장 조회 횟수
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      재접속 건수
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      <span className="inline-flex items-center justify-end gap-1">
                        재접속률(%)
                        <AdminInfoTip text={REACCESS_RATE_TOOLTIP} />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={String(row.user_id ?? row.email ?? i)}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                    >
                      <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {row.user_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">{row.username ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.email ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {row.wordbook_view_count != null && Number.isFinite(row.wordbook_view_count)
                          ? row.wordbook_view_count.toLocaleString("ko-KR")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {row.reaccess_count != null && Number.isFinite(row.reaccess_count)
                          ? row.reaccess_count.toLocaleString("ko-KR")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                        {formatReaccessRate(row.reaccess_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <nav
              className="mt-6 flex flex-wrap items-center justify-between gap-3"
              aria-label="페이지 이동"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
              >
                이전
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
              >
                다음
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
    </>
  );
}
