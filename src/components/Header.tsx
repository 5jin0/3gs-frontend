"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const pathname = usePathname();
  const { isLoggedIn, isAdmin, isSessionProfileReady, logout } = useAuth();
  const isLoginPage = pathname === "/login";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-zinc-100 hover:opacity-90"
        >
          <img
            src="/pangyo-pass-logo-light.svg"
            alt=""
            className="h-9 w-auto shrink-0 object-contain object-left"
            aria-hidden
          />
          판교패스
        </Link>

        {isLoggedIn && !isLoginPage ? (
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

