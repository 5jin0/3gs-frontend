export function SearchBar() {
  return (
    <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="keyword">
          검색어
        </label>
        <input
          id="keyword"
          type="text"
          inputMode="search"
          placeholder="예: 커피챗, 얼라인, 바텀업..."
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus-visible:ring-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-500 dark:placeholder:text-zinc-500"
        />
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
        >
          검색
        </button>
      </div>
    </div>
  );
}

