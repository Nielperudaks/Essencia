import type { ReactNode } from "react"
import type { Metadata } from "next"
import { AdminAuthProvider } from "@/components/admin/admin-auth-context"
import { noIndexMetadata } from "@/lib/seo"

export const metadata: Metadata = noIndexMetadata(
  "Admin",
  "Private Essencia administration area.",
)

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}
