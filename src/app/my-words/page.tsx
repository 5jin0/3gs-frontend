"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  getMyWords,
  isUnauthorizedError,
  removeSavedTerm,
  type SavedWord,
} from "@/lib/wordbook";

function MyWordsLoading() {
  return (
    <div
      className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-zinc-700/80 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <span
        className="size-5 shrink-0 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200"
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

  const normalizedQuery = query.trim().toLowerCase();

  const filteredWords = useMemo(() => {
    if (!normalizedQuery) return words;
    return words.filter((item) => {
      const haystack = [
        item.term,
        item.original_meaning,
        item.definition,
        item.example,
      ]
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, words]);

  const hasSearch = normalizedQuery.length > 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    setQuery(q);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const next = query.trim();
      if (next.length > 0) params.set("q", next);
      else params.delete("q");
      const qs = params.toString();
      const target = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash ?? ""}`;
      window.history.replaceState(window.history.state, "", target);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <main className="relative mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_10%,rgba(77,99,255,0.22),transparent_60%)]"
      />

      <header className="mx-auto mb-8 max-w-3xl text-left">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          내 단어장
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          저장한 단어를 한 곳에서 모아 볼 수 있어요
        </p>
      </header>

      {!loading && !loadError && !authError && (
        <div className="mx-auto mb-5 max-w-3xl rounded-full border border-[#4A5DFF]/60 bg-zinc-950/70 p-1.5 shadow-[0_0_24px_rgba(74,93,255,0.18)] backdrop-blur">
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
              placeholder="내 단어장을 검색해 보세요"
              className="h-11 w-full rounded-full bg-transparent px-4 text-sm text-zinc-100 outline-none ring-[#4A5DFF]/70 transition-shadow placeholder:text-zinc-500 focus-visible:ring-2"
            />
            {query.trim().length > 0 ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="검색어 지우기"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-300 shadow-sm transition-colors hover:bg-zinc-800"
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
          className="mx-auto max-w-3xl rounded-xl border border-zinc-700/80 bg-zinc-900/70 px-4 py-3 text-left text-sm text-zinc-300 shadow-sm"
          role="alert"
        >
          로그인 후 내 단어장을 확인할 수 있습니다.
        </p>
      )}

      {!loading && !authError && loadError && (
        <p
          className="mx-auto max-w-3xl rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-left text-sm text-red-300 shadow-sm"
          role="alert"
        >
          단어장을 불러오지 못했습니다.
        </p>
      )}

      {!loading && !loadError && !authError && words.length === 0 && (
        <section className="mx-auto mt-16 flex max-w-3xl flex-col items-center text-center">
          <div
            aria-hidden
            className="relative mb-6 flex size-32 items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_30%_30%,rgba(167,168,255,0.35),rgba(74,93,255,0.22)_55%,rgba(30,30,43,0.92)_100%)]"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-14 text-[#A7A8FF]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-3.5-3.5" />
              <path d="M9 11h4" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-zinc-100">
            아직 저장한 단어가 없습니다.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            단어를 검색한 뒤 저장하면 이곳에서 다시 확인할 수 있어요.
          </p>
        </section>
      )}

      {!loading && !loadError && !authError && words.length > 0 && (
        <ul className="mx-auto flex max-w-3xl flex-col gap-4">
          {hasSearch ? (
            <p className="text-sm text-zinc-400" role="status" aria-live="polite">
              총 {words.length}개 / 검색 결과 {filteredWords.length}개
            </p>
          ) : null}
          {removeError && (
            <p
              className="text-sm text-red-300"
              role="alert"
            >
              {removeError}
            </p>
          )}
          {filteredWords.length === 0 ? (
            <p className="rounded-xl border border-zinc-700/80 bg-zinc-900/70 px-4 py-3 text-left text-sm text-zinc-300 shadow-sm">
              검색 결과가 없습니다
            </p>
          ) : (
            filteredWords.map((item) => (
              <li
                key={item.id}
                className="rounded-3xl border border-[#4A5DFF]/35 bg-zinc-900/70 p-6 shadow-[0_14px_36px_rgba(10,10,25,0.45)]"
              >
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      용어
                    </dt>
                    <dd className="mt-1.5 text-4xl font-semibold tracking-tight text-[#A7A8FF] sm:text-[2.1rem]">
                      {item.term}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      원래 의미
                    </dt>
                    <dd className="mt-1.5 leading-relaxed text-zinc-200">
                      {item.original_meaning || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      정의
                    </dt>
                    <dd className="mt-1.5 leading-relaxed text-zinc-100">
                      {item.definition || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      예시
                    </dt>
                    <dd className="mt-1.5 rounded-xl border-l-2 border-zinc-600 bg-zinc-950/70 py-2 pl-3 pr-2 leading-relaxed text-zinc-300">
                      {item.example || "—"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex justify-end border-t border-zinc-700/70 pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemove(item.term_id)}
                    disabled={removingTermId !== null}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 px-4 text-xs font-medium text-zinc-200 shadow-sm transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removingTermId === item.term_id ? "처리 중…" : "저장 취소"}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </main>
  );
}
