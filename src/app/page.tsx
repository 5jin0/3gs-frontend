import { SearchBar } from "@/components/SearchBar";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl items-center justify-center px-6 py-14">
      <section className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          판교패스
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400 sm:text-lg">
          모르는 판교어를 검색하고 저장하세요
        </p>

        <SearchBar />
      </section>
    </main>
  );
}
