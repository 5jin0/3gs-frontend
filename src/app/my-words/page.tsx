"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import {
  getMyWords,
  isUnauthorizedError,
  removeSavedTerm,
  type SavedWord,
} from "@/lib/wordbook";

function MyWordsLoading() {
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
      <span>불러오는 중...</span>
    </div>
  );
}

export default function MyWordsPage() {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [removingTermId, setRemovingTermId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleRemove(termId: number) {
    setRemoveError(null);
    setRemovingTermId(termId);
    try {
      await removeSavedTerm(termId);
      setWords((prev) => prev.filter((w) => w.term_id !== termId));
    } catch {
      setRemoveError("저장 취소에 실패했습니다.");
    } finally {
      setRemovingTermId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchWords() {
      try {
        const data = await getMyWords();
        if (!cancelled) {
          setWords(data);
          setLoadError(false);
          setAuthError(false);
        }
      } catch (error) {
        if (!cancelled) {
          setWords([]);
          if (isUnauthorizedError(error)) {
            setAuthError(true);
            setLoadError(false);
          } else {
            setLoadError(true);
            setAuthError(false);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const onFocus = () => {
      void fetchWords();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchWords();
      }
    };

    void fetchWords();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return;
    setQuery("");
  }

  return (
    <main className="relative mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_10%,rgba(24,24,27,0.06),transparent_55%)] dark:bg-[radial-gradient(900px_circle_at_50%_10%,rgba(244,244,245,0.08),transparent_55%)]"
      />

      <header className="mb-8 max-w-2xl">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
          내 단어장
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          저장한 판교어를 모아서 볼 수 있어요.
        </p>
      </header>

      {!loading && !loadError && !authError && (
        <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/70">
          <label htmlFor="my-words-search" className="sr-only">
            내 단어장 검색
          </label>
          <div className="flex items-center gap-2">
            <input
              id="my-words-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              aria-label="내 단어장 검색"
              placeholder="내 단어장 검색 (용어/정의/예시)"
              className="h-11 w-full rounded-xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none ring-zinc-400 transition-shadow placeholder:text-zinc-400 focus-visible:ring-2 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-500 dark:placeholder:text-zinc-500"
            />
            {query.trim().length > 0 ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="검색어 지우기"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                X
              </button>
            ) : null}
          </div>
        </div>
      )}

      {loading && <MyWordsLoading />}

      {!loading && authError && (
        <p
          className="mx-auto max-w-2xl rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-left text-sm text-zinc-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-400"
          role="alert"
        >
          로그인 후 내 단어장을 확인할 수 있습니다.
        </p>
      )}

      {!loading && !authError && loadError && (
        <p
          className="mx-auto max-w-2xl rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-left text-sm text-red-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-red-400"
          role="alert"
        >
          단어장을 불러오지 못했습니다.
        </p>
      )}

      {!loading && !loadError && !authError && words.length === 0 && (
        <p className="mx-auto max-w-2xl rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-left text-sm text-zinc-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-400">
          저장한 단어가 없습니다
        </p>
      )}

      {!loading && !loadError && !authError && words.length > 0 && (
        <ul className="mx-auto flex max-w-2xl flex-col gap-4">
          {removeError && (
            <p
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {removeError}
            </p>
          )}
          {words.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-zinc-200/90 bg-white/95 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/85"
            >
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    용어
                  </dt>
                  <dd className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {item.term}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    원래 의미
                  </dt>
                  <dd className="mt-1.5 leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {item.original_meaning || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    정의
                  </dt>
                  <dd className="mt-1.5 leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {item.definition || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    예시
                  </dt>
                  <dd className="mt-1.5 rounded-lg border-l-2 border-zinc-300 bg-zinc-50/80 py-2 pl-3 pr-2 leading-relaxed text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
                    {item.example || "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-end border-t border-zinc-200/80 pt-4 dark:border-zinc-800/70">
                <button
                  type="button"
                  onClick={() => handleRemove(item.term_id)}
                  disabled={removingTermId !== null}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                >
                  {removingTermId === item.term_id ? "처리 중…" : "저장 취소"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
