import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/70 bg-white/70 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 hover:opacity-90 dark:text-zinc-50"
        >
          판교패스
        </Link>

        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
        >
          로그인
        </Link>
      </div>
    </header>
  );
}

