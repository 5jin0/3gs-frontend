import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "저장 단어",
};

export default function AdminSavesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
