import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사용자",
};

export default function AdminUsersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
