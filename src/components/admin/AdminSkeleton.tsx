"use client";

export function AdminSkeleton({
  variant = "block",
  className = "",
}: {
  variant?: "block" | "cards" | "table" | "stack";
  className?: string;
}) {
  const base = "rounded-xl border border-zinc-200/80 bg-zinc-100/80 animate-pulse dark:border-zinc-800/70 dark:bg-zinc-900/40";

  if (variant === "cards") {
    return (
      <div className={`mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`} aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-28 ${base}`} />
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div
        className={`mt-8 h-64 ${base} ${className}`}
        aria-busy="true"
      />
    );
  }

  if (variant === "stack") {
    return (
      <div className={`mt-8 space-y-6 ${className}`} aria-busy="true">
        <div className={`h-36 ${base}`} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`h-28 ${base}`} />
          <div className={`h-28 ${base}`} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mt-8 h-48 ${base} ${className}`}
      aria-busy="true"
    />
  );
}
