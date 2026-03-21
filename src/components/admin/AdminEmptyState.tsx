"use client";

export function AdminEmptyState({ message }: { message: string }) {
  return (
    <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
  );
}
