"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, Mail, ChevronLeft } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-context"

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, token, loading } = useAdminAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && token) router.replace("/admin")
  }, [token, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      router.push("/admin")
    } catch (err) {
      const e = err as Error
      setError(e.message || "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background px-6" data-testid="admin-login-page">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to store
        </Link>

        <div className="bg-card rounded-3xl p-8 lg:p-10 blocks-shadow border border-border">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-serif text-3xl text-foreground">Admin Login</h1>
            <p className="text-sm text-muted-foreground mt-2">Manage your Essencia store</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="admin-email-input"
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-background border border-border focus:outline-none focus:border-primary"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="admin-password-input"
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-background border border-border focus:outline-none focus:border-primary"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-2xl" data-testid="admin-login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="admin-login-submit"
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 blocks-transition"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
