import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개요",
};

export default function AdminMainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
