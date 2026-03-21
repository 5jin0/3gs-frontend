import { SearchBar } from "@/components/SearchBar";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl items-center justify-center px-6 py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_15%,rgba(77,99,255,0.22),transparent_60%)]"
      />
      <section className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-6xl">
          <span className="text-[#4A5DFF]">판교패스</span>로 검색하세요
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
          모르는 판교어를 검색하고 저장하세요
        </p>

        <SearchBar />
      </section>
    </main>
  );
}
