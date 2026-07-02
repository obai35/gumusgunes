'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-store'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login, totpPending, setTotpPending } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [totpEmail, setTotpEmail] = useState('')

  useEffect(() => {
    if (totpPending) setTotpEmail(totpPending.email)
  }, [totpPending])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const body: any = { email, password }
    if (totpPending) { body.email = totpEmail; body.totpToken = totpCode }
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      login(data.user)
      toast.success('Welcome back!')
      router.push('/')
    } else if (data.totpRequired) {
      setTotpPending({ userId: data.userId, email: email || totpEmail })
      setLoading(false)
      return
    } else {
      toast.error(data.error || 'Login failed')
    }
    setLoading(false)
  }

  if (totpPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-semibold text-navy">Two-Factor Auth</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the code from your authenticator app</p>
            <p className="text-xs text-muted-foreground mt-2">{totpEmail}</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
            <div>
              <label className="text-sm font-medium text-navy">Authentication Code</label>
              <input type="text" inputMode="numeric" autoFocus required value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1 text-center text-2xl tracking-[0.3em] font-mono" placeholder="000000" maxLength={6} />
            </div>
            <button type="submit" disabled={loading || totpCode.length !== 6} className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" onClick={() => setTotpPending(null)} className="w-full py-2 text-xs text-muted-foreground hover:text-navy transition-colors">Back to sign in</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-gold/30">
              <img src="/gumusgunes-logo.jpeg" alt="Gümüş Güneş" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-2xl font-semibold text-navy">Gümüş <span className="gold-text">Güneş</span></span>
          </Link>
          <h1 className="text-2xl font-display font-semibold text-navy">Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back to Silver Sun</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-medium text-navy">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-muted-foreground">or continue with</span></div>
          </div>
          <a href="/api/customer/auth/google" className="flex items-center justify-center gap-3 w-full py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </a>
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-gold hover:text-gold/80 font-medium">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
