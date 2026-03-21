import { SearchBar } from "@/components/SearchBar";

const DECORATIVE_TAGS = ["OKR", "SaaS", "A/B TEST", "Scikit-Learn", "KPI"] as const;

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl items-center justify-center px-6 py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_15%,rgba(77,99,255,0.22),transparent_60%)]"
      />
      <section className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-6xl">
          <span className="inline-block bg-gradient-to-r from-[#2529FF] to-[#7404FF] bg-clip-text text-transparent">
            판교패스
          </span>
          로 검색하세요
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
          궁금했던 판교를 한 곳에서 검색하고 저장할 수 있어요
        </p>

        <SearchBar />

        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
          aria-hidden="true"
        >
          {DECORATIVE_TAGS.map((label) => (
            <span
              key={label}
              className="rounded-full border border-zinc-700/35 bg-zinc-900/85 px-4 py-1.5 text-sm text-zinc-200"
            >
              {label}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
