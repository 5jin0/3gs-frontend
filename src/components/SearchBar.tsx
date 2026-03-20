"use client";

import { useState, type FormEvent } from "react";
import { searchTerms, type PangyoTerm } from "@/lib/pangyo-terms";

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
    <div className="mx-auto mt-10 w-full max-w-xl space-y-5">
      <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/60">
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
      </div>

      {!loading && results.length > 0 && (
        <ul className="flex max-h-[min(28rem,calc(100dvh-12rem))] flex-col gap-4 overflow-y-auto pr-1 text-left">
          {results.map((item, index) => (
            <ResultCard key={`${item.term}-${index}`} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
