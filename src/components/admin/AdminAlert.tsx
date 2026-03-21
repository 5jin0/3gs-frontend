"use client";

import type { ReactNode } from "react";

type Variant = "error" | "info";

const styles: Record<Variant, string> = {
  error:
    "border-amber-200/90 bg-amber-50/90 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
  info: "border-sky-200/90 bg-sky-50/90 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100",
};

export function AdminAlert({
  variant = "error",
  children,
  role = "alert",
  className = "",
}: {
  variant?: Variant;
  children: ReactNode;
  role?: "alert" | "status";
  className?: string;
}) {
  return (
    <div
      className={`mt-8 rounded-xl border px-4 py-3 text-sm ${styles[variant]} ${className}`}
      role={role}
    >
      {children}
    </div>
  );
}
