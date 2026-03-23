"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "대시보드",
    links: [{ href: "/admin", label: "개요" }] as const,
  },
  {
    title: "분석",
    links: [
      { href: "/admin/funnel", label: "검색 퍼널" },
      { href: "/admin/search-ux", label: "검색 경험" },
      { href: "/admin/cohorts", label: "접속·코호트" },
      { href: "/admin/retention", label: "리텐션" },
      { href: "/admin/saved-counts", label: "유저별 저장" },
      { href: "/admin/wordbook-reaccess", label: "단어장 재접속" },
    ] as const,
  },
  {
    title: "데이터",
    links: [
      { href: "/admin/users", label: "사용자" },
      { href: "/admin/terms", label: "용어" },
      { href: "/admin/saves", label: "저장 단어" },
    ] as const,
  },
] as const;

function linkClass(active: boolean) {
  return [
    "inline-flex border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
    active
      ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200",
  ].join(" ");
}

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/admin"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="mb-8 border-b border-zinc-200 dark:border-zinc-800" aria-label="관리자 메뉴">
      <div className="flex flex-col gap-5">
        {sections.map((section) => (
          <div
            key={section.title}
            className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6 lg:items-center"
          >
            <span className="shrink-0 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 sm:w-24">
              {section.title}
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-2">
              {section.links.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={linkClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
