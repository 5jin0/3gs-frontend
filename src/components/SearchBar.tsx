"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTermSuggestions,
  searchTerms,
  trackSearchComplete,
  trackSearchExit,
  trackSearchStart,
  trackSuggestionSelect,
  type PangyoTerm,
  type PangyoTermSuggestion,
} from "@/lib/pangyo-terms";
import {
  getMyWords,
  getWordbookErrorMessage,
  isDuplicateSavedTermError,
  isMissingTokenError,
  isUnauthorizedError,
  saveTerm,
} from "@/lib/wordbook";

function getTermIdForSave(item: PangyoTerm): number | null {
  const id = item.term_id ?? item.id;
  return id != null && Number.isFinite(id) ? id : null;
}

function LoadingIndicator() {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-400"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="size-5 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200"
        aria-hidden
      />
      <span>검색 중입니다…</span>
    </div>
  );
}

type SaveFeedback = {
  text: string;
  kind: "success" | "warn" | "error";
};

function ResultCard({
  item,
  termId,
  isSaved,
  onSaved,
}: {
  item: PangyoTerm;
  termId: number | null;
  isSaved: boolean;
  onSaved: (termId: number) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<SaveFeedback | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function handleSave() {
    if (termId == null || isSaved || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const result = await saveTerm(termId);
      onSaved(result.termId);
      if (result.alreadySaved) {
        setFeedback({ kind: "warn", text: "이미 저장된 단어입니다." });
      } else if (result.saved) {
        setFeedback({ kind: "success", text: "단어장에 저장되었습니다." });
      } else {
        setFeedback({ kind: "error", text: "저장 결과를 확인할 수 없습니다." });
      }
    } catch (e) {
      if (isDuplicateSavedTermError(e)) {
        onSaved(termId);
        setFeedback({ kind: "warn", text: "이미 저장된 단어입니다." });
      } else if (isMissingTokenError(e)) {
        setFeedback({ kind: "warn", text: "로그인 후 저장할 수 있습니다." });
      } else if (isUnauthorizedError(e)) {
        setFeedback({ kind: "warn", text: "로그인 후 저장할 수 있습니다." });
      } else {
        setFeedback({
          kind: "error",
          text: getWordbookErrorMessage(e, "저장에 실패했습니다."),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const feedbackClass =
    feedback?.kind === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : feedback?.kind === "warn"
        ? "text-amber-800 dark:text-amber-300"
        : feedback?.kind === "error"
          ? "text-red-600 dark:text-red-400"
          : "";

  return (
    <li className="rounded-2xl border border-zinc-200/90 bg-white/95 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/85">
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
      <div className="mt-4 flex flex-col items-stretch gap-2 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/70">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={termId == null || isSaved || saving}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
          >
            {saving ? "저장 중…" : "단어 저장"}
          </button>
        </div>
        {termId == null && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            저장할 수 없습니다. (용어 id가 없음)
          </p>
        )}
        {isSaved && !feedback && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status">
            이미 저장된 단어입니다.
          </p>
        )}
        {feedback && (
          <p className={`text-xs ${feedbackClass}`} role="status">
            {feedback.text}
          </p>
        )}
      </div>
    </li>
  );
}

export function SearchBar() {
  const { isLoggedIn } = useAuth();
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);
  const suggestionsCacheRef = useRef(new Map<string, PangyoTermSuggestion[]>());
  const inFlightSuggestionKeywordRef = useRef<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<PangyoTermSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<PangyoTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTermIds, setSavedTermIds] = useState<Set<number>>(
    () => new Set(),
  );
  const searchSessionIdRef = useRef<string | null>(null);
  const searchSessionStartedRef = useRef(false);
  const searchSessionCompletedRef = useRef(false);
  const searchSessionExitSentRef = useRef(false);
  const lastSubmittedKeywordRef = useRef("");

  const canSubmit = keyword.trim().length > 0 && !loading;

  function nextSessionId() {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function ensureSearchSession(trigger: "focus" | "input" | "submit", rawKeyword?: string) {
    if (!searchSessionIdRef.current) {
      searchSessionIdRef.current = nextSessionId();
      searchSessionStartedRef.current = false;
      searchSessionCompletedRef.current = false;
      searchSessionExitSentRef.current = false;
    }

    if (searchSessionStartedRef.current) return;

    searchSessionStartedRef.current = true;
    const q = rawKeyword?.trim();
    void trackSearchStart({
      session_id: searchSessionIdRef.current,
      keyword: q && q.length > 0 ? q : undefined,
      trigger,
    }).catch(() => {
      // Fire-and-forget: tracking failure should never block search UX.
    });
  }

  function markSearchComplete(keywordForEvent: string, resultCount: number, success: boolean) {
    const sessionId = searchSessionIdRef.current;
    if (!sessionId || searchSessionCompletedRef.current) return;
    searchSessionCompletedRef.current = true;
    void trackSearchComplete({
      session_id: sessionId,
      keyword: keywordForEvent,
      result_count: Math.max(0, resultCount),
      success,
    }).catch(() => {
      // Fire-and-forget: tracking failure should never block search UX.
    });
  }

  function markSearchExit(reason: "route_change" | "pagehide" | "visibility_hidden" | "unmount") {
    const sessionId = searchSessionIdRef.current;
    if (!sessionId || searchSessionExitSentRef.current) return;
    searchSessionExitSentRef.current = true;
    void trackSearchExit({
      session_id: sessionId,
      keyword: lastSubmittedKeywordRef.current || undefined,
      had_complete: searchSessionCompletedRef.current,
      reason,
    }).catch(() => {
      // Fire-and-forget: tracking failure should never block search UX.
    });
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setSavedTermIds(new Set());
      return;
    }
    if (results.length === 0) {
      setSavedTermIds(new Set());
      return;
    }

    let cancelled = false;
    getMyWords()
      .then((words) => {
        if (cancelled) return;
        setSavedTermIds(new Set(words.map((w) => w.term_id)));
      })
      .catch(() => {
        if (!cancelled) setSavedTermIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, results]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (!suggestionsContainerRef.current?.contains(target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, []);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        markSearchExit("visibility_hidden");
      }
    }
    function onPageHide() {
      markSearchExit("pagehide");
    }
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      markSearchExit("unmount");
    };
  }, []);

  useEffect(() => {
    const q = keyword.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const cached = suggestionsCacheRef.current.get(q);
    if (cached) {
      setSuggestions(cached);
      setShowSuggestions(cached.length > 0);
      return;
    }

    if (inFlightSuggestionKeywordRef.current === q) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      inFlightSuggestionKeywordRef.current = q;
      try {
        const data = await getTermSuggestions(q);
        if (!active) return;
        suggestionsCacheRef.current.set(q, data);
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        if (!active) return;
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (inFlightSuggestionKeywordRef.current === q) {
          inFlightSuggestionKeywordRef.current = null;
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [keyword]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const q = keyword.trim();
    if (!q) return;
    ensureSearchSession("submit", q);
    lastSubmittedKeywordRef.current = q;

    setKeyword(q);
    setShowSuggestions(false);
    setLoading(true);
    setError(null);

    try {
      const data = await searchTerms(q);
      setResults(data);
      requestAnimationFrame(() => {
        markSearchComplete(q, data.length, true);
      });
    } catch {
      setResults([]);
      setError("검색 중 문제가 발생했습니다.");
      requestAnimationFrame(() => {
        markSearchComplete(q, 0, false);
      });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  function handleKeywordKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    // Avoid submitting while IME composition is active (e.g. Korean input).
    if (e.nativeEvent.isComposing) {
      e.preventDefault();
    }
  }

  function handleSuggestionClick(term: string) {
    setKeyword(term);
    setShowSuggestions(false);
    void trackSuggestionSelect(term).catch(() => {
      // Fire-and-forget: tracking failure should never block input UX.
    });
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-[27rem] space-y-4">
      <div className="rounded-full border border-[#4A5DFF]/60 bg-zinc-950/70 p-1.5 shadow-[0_0_24px_rgba(74,93,255,0.18)] backdrop-blur">
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="keyword">
            검색어
          </label>
          <div ref={suggestionsContainerRef} className="relative w-full">
            <input
              id="keyword"
              name="keyword"
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={keyword}
              onChange={(e) => {
                const next = e.target.value;
                setKeyword(next);
                if (next.trim().length > 0) ensureSearchSession("input", next);
              }}
              onFocus={() => {
                setShowSuggestions(suggestions.length > 0);
                ensureSearchSession("focus", keyword);
              }}
              onBlur={() => {
                setKeyword((k) => k.trim());
              }}
              onKeyDown={handleKeywordKeyDown}
              disabled={loading}
              placeholder="SaaS, 커피챗, 얼라인 등을 검색해 보세요"
              autoComplete="off"
              className="h-11 w-full rounded-full bg-transparent px-4 text-sm text-zinc-100 outline-none ring-[#4A5DFF]/60 placeholder:text-zinc-500 transition-shadow focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-3xl border border-[#4A5DFF]/60 bg-zinc-950/95 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                {suggestions.map((item, idx) => (
                  <li key={item.term}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(item.term)}
                      className={[
                        "w-full rounded-xl px-4 py-2 text-left text-sm transition-colors",
                        idx === 0
                          ? "bg-zinc-800/75 text-zinc-100"
                          : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100",
                      ].join(" ")}
                    >
                      {item.term}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-8 text-sm font-medium text-zinc-200 shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5DFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </form>

        {!loading && error && (
          <p className="mt-4 text-left text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      {loading && (
        <div className="text-left">
          <LoadingIndicator />
        </div>
      )}

      {!loading && results.length > 0 && (
        <ul className="flex max-h-[min(28rem,calc(100dvh-12rem))] flex-col gap-4 overflow-y-auto pr-1 text-left">
          {results.map((item, index) => {
            const termId = getTermIdForSave(item);
            const isSaved = termId != null && savedTermIds.has(termId);
            return (
              <ResultCard
                key={termId != null ? `term-${termId}` : `${item.term}-${index}`}
                item={item}
                termId={termId}
                isSaved={isSaved}
                onSaved={(id) =>
                  setSavedTermIds((prev) => new Set([...prev, id]))
                }
              />
            );
          })}
        </ul>
      )}

      {!loading && !error && searched && results.length === 0 && (
        <p className="rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-left text-sm text-zinc-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-400">
          검색 결과가 없습니다
        </p>
      )}
    </div>
  );
}
