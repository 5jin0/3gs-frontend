/** Placeholder rows for layout only; replace with API data later. */
const MOCK_SAVED_TERMS = [
  {
    id: 1,
    term: "커피챗",
    original_meaning: "coffee chat",
    definition: "업무 외 가벼운 대화로 네트워킹하는 자리.",
    example: "이번 주 금요일에 커피챗 한번 잡을까요?",
  },
  {
    id: 2,
    term: "얼라인",
    original_meaning: "align",
    definition: "방향·목표·일정 등을 맞추다.",
    example: "스프린트 목표부터 먼저 얼라인할게요.",
  },
] as const;

export default function MyWordsPage() {
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

      <ul className="mx-auto flex max-w-2xl flex-col gap-4">
        {MOCK_SAVED_TERMS.map((item) => (
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
          </li>
        ))}
      </ul>
    </main>
  );
}
