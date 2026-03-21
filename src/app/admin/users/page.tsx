"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminUsers,
  isAdminForbiddenError,
  isAdminUsersNotFoundError,
  type AdminUser,
} from "@/lib/admin";

function formatCell(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value;
  return "—";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchAdminUsers();
        if (!cancelled) {
          setUsers(data);
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
        if (isAdminForbiddenError(e)) {
          setError("이 목록은 관리자만 조회할 수 있습니다.");
        } else if (isAdminUsersNotFoundError(e)) {
          setError("사용자 목록 API가 아직 없거나 경로가 다릅니다. (GET /admin/users)");
        } else {
          setError("사용자 목록을 불러오지 못했습니다.");
        }
        setUsers([]);
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
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">사용자</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        등록된 사용자를 확인합니다. 백엔드 필드에 맞게 표시 컬럼을 조정할 수 있습니다.
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
          {users.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
              표시할 사용자가 없습니다.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    사용자명
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    이메일
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    관리자
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={String(u.id ?? i)}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                  >
                    <td className="px-4 py-3 tabular-nums text-zinc-900 dark:text-zinc-50">{formatCell(u.id)}</td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {formatCell(u.username ?? u.name)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{formatCell(u.email)}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {formatCell(u.is_admin)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatCell(u.created_at)}</td>
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
