"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminOverview,
  isAdminForbiddenError,
  isAdminOverviewNotFoundError,
  type AdminOverview,
} from "@/lib/admin";

function formatStat(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim() !== "") return value;
  return "—";
}

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchAdminOverview();
        if (!cancelled) {
          setOverview(data);
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
        if (isAdminForbiddenError(e)) {
          setError("이 요약은 관리자만 조회할 수 있습니다.");
        } else if (isAdminOverviewNotFoundError(e)) {
          setError("관리자 요약 API가 아직 없거나 경로가 다릅니다. (GET /admin/overview)");
        } else {
          setError("요약을 불러오지 못했습니다.");
        }
        setOverview(null);
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
      <h1 className="text-xl font-semibold tracking-tight text-[#E0E0E0]">개요</h1>

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
          요약 불러오는 중...
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

      {!loading && !error && overview ? (
        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              사용자 수
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatStat(overview.user_count)}
            </dd>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              용어 수
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatStat(overview.term_count)}
            </dd>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              저장된 단어 수
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatStat(overview.saved_term_count)}
            </dd>
          </div>
        </dl>
      ) : null}
    </>
  );
}
