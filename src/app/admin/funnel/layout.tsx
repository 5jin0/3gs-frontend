import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색 퍼널",
};

export default function AdminFunnelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
