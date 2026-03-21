"use client";

import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadUserSavedCountsCsv,
  fetchUserSavedCounts,
  isUserSavedCountsNotFoundError,
  type UserSavedCountRow,
  type UserSavedCountSort,
} from "@/lib/admin-user-saved-counts";
import { isAdminForbiddenError } from "@/lib/admin";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type SortColumn = "save_count" | "username";

function toSortParam(column: SortColumn, dir: "asc" | "desc"): UserSavedCountSort {
  if (column === "save_count") {
    return dir === "desc" ? "save_count_desc" : "save_count_asc";
  }
  return dir === "asc" ? "username_asc" : "username_desc";
}

function sortLabel(column: SortColumn, active: SortColumn, dir: "asc" | "desc"): string {
  if (column !== active) return "";
  return dir === "asc" ? " ↑" : " ↓";
}

export default function AdminUserSavedCountsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortColumn, setSortColumn] = useState<SortColumn>("save_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sort = useMemo(
    () => toSortParam(sortColumn, sortDir),
    [sortColumn, sortDir],
  );

  const [rows, setRows] = useState<UserSavedCountRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserSavedCounts({ page, pageSize, sort });
      setRows(res.items);
      setTotal(res.total);
    } catch (e) {
      if (isAdminForbiddenError(e)) {
        setError("이 목록은 관리자만 조회할 수 있습니다.");
      } else if (isUserSavedCountsNotFoundError(e)) {
        setError(
          "유저별 저장 횟수 API가 아직 없거나 경로가 다릅니다. (GET /admin/analytics/user-saved-counts)",
        );
      } else {
        setError("목록을 불러오지 못했습니다.");
      }
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDir(column === "username" ? "asc" : "desc");
    }
    setPage(1);
  }

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadUserSavedCountsCsv(rows, `user-saved-counts-p${page}-${stamp}.csv`);
  }

  return (
    <>
      <AdminPageHeader
        title="유저별 단어 저장 횟수"
        description="사용자별 저장한 단어 수를 정렬·페이지로 확인합니다. CSV는 현재 페이지 데이터만 내보냅니다."
      >
        <div className="flex flex-wrap items-center gap-3">
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
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      사용자 ID
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      <button
                        type="button"
                        onClick={() => handleSort("username")}
                        className="inline-flex items-center gap-1 font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                      >
                        사용자명
                        {sortLabel("username", sortColumn, sortDir)}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      이메일
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      <button
                        type="button"
                        onClick={() => handleSort("save_count")}
                        className="inline-flex w-full items-center justify-end gap-1 font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                      >
                        저장 횟수
                        {sortLabel("save_count", sortColumn, sortDir)}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={String(r.user_id ?? r.email ?? i)}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                    >
                      <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {r.user_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">{r.username ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{r.email ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                        {r.save_count != null && Number.isFinite(r.save_count)
                          ? r.save_count.toLocaleString("ko-KR")
                          : "—"}
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
