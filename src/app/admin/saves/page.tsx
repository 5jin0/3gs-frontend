"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminSavedEntries,
  isAdminForbiddenError,
  isAdminSavesNotFoundError,
  type AdminSavedEntry,
} from "@/lib/admin";

function formatCell(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value;
  return "—";
}

function rowKey(row: AdminSavedEntry, index: number): string {
  const id = row.id ?? row.saved_id;
  if (id != null) return String(id);
  return `${row.user_id ?? ""}-${row.term_id ?? ""}-${index}`;
}

export default function AdminSavesPage() {
  const [rows, setRows] = useState<AdminSavedEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchAdminSavedEntries();
        if (!cancelled) {
          setRows(data);
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
        if (isAdminForbiddenError(e)) {
          setError("이 목록은 관리자만 조회할 수 있습니다.");
        } else if (isAdminSavesNotFoundError(e)) {
          setError("저장 단어 목록 API가 아직 없거나 경로가 다릅니다. (GET /admin/saves)");
        } else {
          setError("저장 단어 목록을 불러오지 못했습니다.");
        }
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-[#E0E0E0]">저장 단어</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        사용자들이 단어장에 저장한 항목을 전체 조회합니다.
      </p>

      {loading ? (
        <div
          className="mt-8 flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-400"
          role="status"
          aria-live="polite"
        >
          <span
            className="size-5 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200"
            aria-hidden
          />
          불러오는 중...
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

      {!loading && !error ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
              표시할 저장 단어가 없습니다.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    기록 ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    사용자
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    사용자 ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    용어 ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    용어
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    저장일
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={rowKey(row, i)}
                    className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-800/80"
                  >
                    <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatCell(row.id ?? row.saved_id)}
                    </td>
                    <td className="max-w-[10rem] px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      <span className="line-clamp-2">{formatCell(row.username)}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatCell(row.user_id)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatCell(row.term_id)}
                    </td>
                    <td className="max-w-[14rem] px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      <span className="line-clamp-2">{formatCell(row.term)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatCell(row.saved_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </>
  );
}
