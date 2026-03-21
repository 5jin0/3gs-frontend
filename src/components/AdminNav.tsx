"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "개요" },
  { href: "/admin/funnel", label: "검색 퍼널" },
  { href: "/admin/search-ux", label: "검색 경험" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/terms", label: "용어" },
  { href: "/admin/saves", label: "저장 단어" },
] as const;

function linkClass(active: boolean) {
  return [
    "inline-flex items-center border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
    active
      ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200",
  ].join(" ");
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 border-b border-zinc-200 dark:border-zinc-800" aria-label="관리자 메뉴">
      <div className="flex flex-wrap gap-6">
        {links.map(({ href, label }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={linkClass(active)} aria-current={active ? "page" : undefined}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
