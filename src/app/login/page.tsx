"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { login } from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await login(username, password);
      setAuth(res.access_token, res.user);
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "로그인에 실패했습니다.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl items-center justify-center px-6 py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_15%,rgba(24,24,27,0.08),transparent_55%)] dark:bg-[radial-gradient(900px_circle_at_50%_15%,rgba(244,244,245,0.10),transparent_55%)]"
      />
      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/60 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            판교패스 로그인
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            계정으로 로그인해 판교어를 저장하고 다시 확인하세요.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
              >
                이메일
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="email"
                placeholder="name@company.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 transition-shadow focus-visible:ring-2 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-500 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 transition-shadow focus-visible:ring-2 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-500 dark:placeholder:text-zinc-500"
              />
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

