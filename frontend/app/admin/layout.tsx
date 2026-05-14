import type { ReactNode } from "react"
import { AdminAuthProvider } from "@/components/admin/admin-auth-context"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}
