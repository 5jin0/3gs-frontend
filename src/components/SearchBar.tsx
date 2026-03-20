"use client";

import { useState, type FormEvent } from "react";
import { searchTerms, type PangyoTerm } from "@/lib/pangyo-terms";

export function SearchBar() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<PangyoTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) {
      setResults([]);
      setSearched(true);
      setError(null);
      return;
    }

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

  return (
    <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/60">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="keyword">
          검색어
        </label>
        <input
          id="keyword"
          name="keyword"
          type="text"
          inputMode="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={loading}
          placeholder="예: 커피챗, 얼라인, 바텀업..."
          className="h-12 w-full rounded-xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 transition-shadow focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-500 dark:placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap sm:w-auto dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {loading && (
        <p className="mt-4 text-left text-sm text-zinc-500 dark:text-zinc-400" role="status">
          불러오는 중...
        </p>
      )}

      {!loading && error && (
        <p className="mt-4 text-left text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && searched && results.length === 0 && (
        <p className="mt-4 text-left text-sm text-zinc-500 dark:text-zinc-400">
          결과가 없습니다.
        </p>
      )}

      {!loading && results.length > 0 && (
        <ul className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto text-left">
          {results.map((item, index) => (
            <li
              key={`${item.term}-${index}`}
              className="rounded-xl border border-zinc-200/80 bg-white/90 p-4 text-sm dark:border-zinc-800/70 dark:bg-zinc-950/80"
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.term}</p>
              {item.original_meaning ? (
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">{item.original_meaning}</p>
              ) : null}
              {item.definition ? (
                <p className="mt-2 text-zinc-800 dark:text-zinc-300">{item.definition}</p>
              ) : null}
              {item.example ? (
                <p className="mt-2 border-l-2 border-zinc-300 pl-3 text-zinc-600 italic dark:border-zinc-600 dark:text-zinc-400">
                  {item.example}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
