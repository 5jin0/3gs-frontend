"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  getTermSuggestions,
  searchTerms,
  type PangyoTerm,
  type PangyoTermSuggestion,
} from "@/lib/pangyo-terms";

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

function ResultCard({ item }: { item: PangyoTerm }) {
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
    </li>
  );
}

export function SearchBar() {
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

  const canSubmit = keyword.trim().length > 0 && !loading;

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
    const q = keyword.trim();
    if (q.length < 2) {
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

    setKeyword(q);
    setShowSuggestions(false);
    setLoading(true);
    setError(null);

    try {
      const data = await searchTerms(q);
      setResults(data);
    } catch {
      setResults([]);
      setError("검색 중 문제가 발생했습니다.");
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
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-xl space-y-5">
      <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/60">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-start" onSubmit={handleSubmit}>
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
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => {
                setKeyword((k) => k.trim());
              }}
              onKeyDown={handleKeywordKeyDown}
              disabled={loading}
              placeholder="예: 커피챗, 얼라인, 바텀업..."
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 transition-shadow focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-500 dark:placeholder:text-zinc-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200/90 bg-white p-1 shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950">
                {suggestions.map((item) => (
                  <li key={item.term}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(item.term)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
            className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap sm:w-auto dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
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
          {results.map((item, index) => (
            <ResultCard key={`${item.term}-${index}`} item={item} />
          ))}
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
