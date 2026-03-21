"use client";

import type { AdminPeriod } from "@/lib/admin-period";
import { ADMIN_PERIOD_OPTIONS } from "@/lib/admin-period";

export function AdminPeriodToggle({
  value,
  onChange,
  ariaLabel = "집계 기간",
}: {
  value: AdminPeriod;
  onChange: (next: AdminPeriod) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      className="inline-flex rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-1 dark:border-zinc-800/70 dark:bg-zinc-900/40"
      role="group"
      aria-label={ariaLabel}
    >
      {ADMIN_PERIOD_OPTIONS.map(({ value: v, label }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
            ].join(" ")}
            aria-pressed={active}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
