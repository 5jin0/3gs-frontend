import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "단어장 재접속",
};

export default function AdminWordbookReaccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
