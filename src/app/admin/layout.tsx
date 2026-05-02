import { headers } from "next/headers";

import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
