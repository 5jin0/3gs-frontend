"use client";

export function AdminInfoTip({ text }: { text: string }) {
  return (
    <span className="inline-flex shrink-0" title={text}>
      <span className="sr-only">{text}</span>
      <span
        className="inline-flex size-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
        aria-hidden
      >
        ?
      </span>
    </span>
  );
}
