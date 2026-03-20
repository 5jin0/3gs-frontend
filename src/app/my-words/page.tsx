export default function MyWordsPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-col px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        내 단어장
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        저장한 단어를 여기에서 모아볼 수 있어요.
      </p>
    </main>
  );
}
