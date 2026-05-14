"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"

type Admin = { id: string; email: string; name: string }
type Ctx = {
  admin: Admin | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<Ctx | undefined>(undefined)
const STORAGE_KEY = "essencia.admin"

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        setToken(data.token)
        setAdmin(data.admin)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (loading) return
    const isAdminRoute = pathname?.startsWith("/admin") && pathname !== "/admin/login"
    if (isAdminRoute && !token) {
      router.replace("/admin/login")
    }
  }, [pathname, token, loading, router])

  async function login(email: string, password: string) {
    const res = await api.login(email, password)
    setToken(res.access_token)
    setAdmin(res.admin)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: res.access_token, admin: res.admin }))
  }

  function logout() {
    setToken(null)
    setAdmin(null)
    localStorage.removeItem(STORAGE_KEY)
    router.push("/admin/login")
  }

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider")
  return ctx
}
