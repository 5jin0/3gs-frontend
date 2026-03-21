"use client";

import type { FormEvent } from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { login } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { safeInternalPath } from "@/lib/safe-redirect";

function LoginFallback() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl items-center justify-center px-6 py-14">
      <p className="text-sm text-zinc-400">로딩 중...</p>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const next = safeInternalPath(searchParams.get("next"));
      router.push(next ?? "/");
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
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_15%,rgba(77,99,255,0.22),transparent_60%)]"
      />
      <section className="w-full max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50">
          로그인
        </h1>
        <p className="mt-3 text-lg text-zinc-400">나만의 업무 용어를 정리해 보세요</p>
        <div className="mt-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-[0_16px_40px_rgba(10,10,20,0.45)] backdrop-blur sm:p-8">
          <h2 className="sr-only">
            판교패스 로그인 폼
          </h2>
          <p className="mb-5 text-left text-sm text-zinc-400">
            계정으로 로그인해 판교어를 저장하고 다시 확인하세요.
          </p>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2 text-left">
              <label
                htmlFor="username"
                className="text-xs font-medium text-zinc-300"
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
                className="h-11 w-full rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none ring-[#4A5DFF]/70 placeholder:text-zinc-500 transition-shadow focus-visible:ring-2"
              />
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-zinc-300"
                >
                  비밀번호
                </label>
                <button
                  type="button"
                  className="text-[11px] font-medium text-[#4A5DFF] hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 w-full rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none ring-[#4A5DFF]/70 placeholder:text-zinc-500 transition-shadow focus-visible:ring-2"
              />
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="text-left text-sm text-red-400"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 px-5 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:translate-y-px"
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-400">
            계정이 없으신가요?{" "}
            <Link
              href="/"
              className="font-medium text-[#4A5DFF] hover:underline"
            >
              가입하기
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
