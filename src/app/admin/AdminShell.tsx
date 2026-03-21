"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminNav } from "@/components/AdminNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminNav />
      {children}
    </AdminGate>
  );
}
