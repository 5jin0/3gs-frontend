"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { isLoggedIn, isAdmin, isSessionProfileReady, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-sm font-semibold tracking-tight text-zinc-100 hover:opacity-90"
        >
          <span
            aria-hidden
            className="inline-block size-6 rounded-md border border-dashed border-zinc-600/80 bg-zinc-900/60"
          />
          판교패스
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <Link
              href="/my-words"
              className="hidden text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:inline"
            >
              내 단어장
            </Link>
            {isSessionProfileReady && isAdmin ? (
              <Link
                href="/admin"
                className="hidden text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:inline"
              >
                관리
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-100 px-4 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}

