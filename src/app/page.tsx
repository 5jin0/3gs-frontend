export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          판교패스
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          업무 중 마주치는 생소한 판교어를 검색하고 저장하세요.
        </p>
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            다음 단계에서 Header / 검색창 / 로그인 화면을 붙일 예정이에요.
          </p>
        </div>
      </div>
    </main>
  );
}
