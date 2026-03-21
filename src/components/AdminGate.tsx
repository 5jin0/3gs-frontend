"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

function AdminLoading() {
  return (
    <div
      className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-400"
      role="status"
      aria-live="polite"
    >
      <span
        className="size-5 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200"
        aria-hidden
      />
      <span>세션 확인 중...</span>
    </div>
  );
}

/**
 * Shared guard for `/admin` routes: login redirect, profile sync, non-admin denial.
 * Renders children only when the user is an authenticated admin after `/auth/me`.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isAdmin, isSessionProfileReady } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      const next = encodeURIComponent(pathname || "/admin");
      router.replace(`/login?next=${next}`);
    }
  }, [isLoggedIn, pathname, router]);

  if (!isLoggedIn) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">로그인 페이지로 이동합니다...</p>
      </main>
    );
  }

  if (!isSessionProfileReady) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <AdminLoading />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mx-auto max-w-lg rounded-xl border border-zinc-200/80 bg-white/90 px-5 py-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">접근할 수 없습니다</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            이 페이지는 관리자만 볼 수 있습니다.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
          >
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  return <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>;
}
