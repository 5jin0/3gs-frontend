"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminTerms,
  isAdminForbiddenError,
  isAdminTermsNotFoundError,
} from "@/lib/admin";
import type { PangyoTerm } from "@/lib/pangyo-terms";

function termKey(t: PangyoTerm, index: number): string {
  return String(t.term_id ?? t.id ?? index);
}

export default function AdminTermsPage() {
  const [terms, setTerms] = useState<PangyoTerm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchAdminTerms();
        if (!cancelled) {
          setTerms(data);
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
        if (isAdminForbiddenError(e)) {
          setError("이 목록은 관리자만 조회할 수 있습니다.");
        } else if (isAdminTermsNotFoundError(e)) {
          setError("용어 목록 API가 아직 없거나 경로가 다릅니다. (GET /admin/terms)");
        } else {
          setError("용어 목록을 불러오지 못했습니다.");
        }
        setTerms([]);
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
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">용어</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        등록된 판교어 용어를 확인합니다. 검색·수정 API는 백엔드에 맞춰 확장할 수 있습니다.
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
          {terms.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
              표시할 용어가 없습니다.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    용어
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    본말
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    정의
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                    예문
                  </th>
                </tr>
              </thead>
              <tbody>
                {terms.map((t, i) => (
                  <tr
                    key={termKey(t, i)}
                    className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-800/80"
                  >
                    <td className="max-w-[6rem] px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {t.term_id ?? t.id ?? "—"}
                    </td>
                    <td className="max-w-[10rem] px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      <span className="line-clamp-3">{t.term}</span>
                    </td>
                    <td className="max-w-[12rem] px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <span className="line-clamp-3">{t.original_meaning || "—"}</span>
                    </td>
                    <td className="max-w-[18rem] px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <span className="line-clamp-3">{t.definition || "—"}</span>
                    </td>
                    <td className="max-w-[18rem] px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      <span className="line-clamp-3">{t.example || "—"}</span>
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
