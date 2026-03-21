"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminNav } from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminNav />
      {children}
    </AdminGate>
  );
}
