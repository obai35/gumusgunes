'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { useAuth } from '@/lib/auth-store'
import { toast } from 'sonner'

declare global {
  interface Window { google?: { accounts: { id: { initialize: (config: any) => void; renderButton: (el: HTMLElement, config: any) => void; prompt: () => void; cancel: () => void } } } }
}

export default function LoginPage() {
  const router = useRouter()
  const { login, totpPending, setTotpPending } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [totpEmail, setTotpEmail] = useState('')
  const [showGoogle, setShowGoogle] = useState(false)
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const clientIdRef = useRef('')

  useEffect(() => {
    if (totpPending) setTotpEmail(totpPending.email)
  }, [totpPending])

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data = await res.json()
      if (res.ok) {
        login(data.user)
        toast.success('Welcome!')
        router.push('/')
      } else if (data.totpRequired) {
        setTotpPending({ userId: data.userId, email: data.email || '' })
      } else {
        toast.error(data.error || 'Google login failed')
      }
    } catch {
      toast.error('Google login failed')
    }
    setLoading(false)
  }, [login, router, setTotpPending])

  useEffect(() => {
    fetch('/api/auth/google')
      .then((r) => r.json())
      .then((data) => {
        if (data.enabled && data.clientId) {
          clientIdRef.current = data.clientId
          setShowGoogle(true)
        }
      })
      .catch(() => {})
  }, [])

  function initGoogle() {
    if (!window.google?.accounts?.id || !googleBtnRef.current || !clientIdRef.current) return
    window.google.accounts.id.initialize({
      client_id: clientIdRef.current,
      callback: handleGoogleCredential,
      cancel_on_tap_outside: false,
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: 'standard', shape: 'rectangular', theme: 'outline', size: 'large',
    })
  }

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
      {showGoogle && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initGoogle} />}
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
          {showGoogle && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-muted-foreground">or continue with</span></div>
              </div>
              <div ref={googleBtnRef} className="flex justify-center" />
            </>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-gold hover:text-gold/80 font-medium">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
