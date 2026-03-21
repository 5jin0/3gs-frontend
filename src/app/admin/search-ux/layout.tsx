import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색 경험",
};

export default function AdminSearchUxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
