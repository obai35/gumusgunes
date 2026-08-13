'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sun } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function AdminLogin() {
  const router = useRouter()
  const { adminLogin, totpPending, setTotpPending } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body: any = { email, password }
    if (totpPending) {
      body.totpCode = totpCode
      body.email = email || totpPending.email
    }

    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (res.ok) {
      if (data.totpRequired) {
        setTotpPending({ email })
        setLoading(false)
        return
      }
      adminLogin(data.user)
      toast.success(ta('Welcome back!'))
      router.push('/admin')
    } else {
      setError(data.error || ta('Invalid credentials'))
    }
    setLoading(false)
  }

  if (totpPending) {
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sun className="h-8 w-8 text-gold" />
              <span className="font-display text-xl text-navy">{ta('Admin')}</span>
            </div>
            <h1 className="text-2xl font-display font-semibold text-navy">{ta('Two-Factor Auth')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{ta('Enter the code from your authenticator app')}</p>
            <p className="text-xs text-muted-foreground mt-2">{email || totpPending.email}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 rounded-lg border border-border text-center text-2xl tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="000000"
              maxLength={6}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-2.5 bg-navy text-silver rounded-lg font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {loading ? ta('Verifying...') : ta('Verify')}
            </button>
            <button
              type="button"
              onClick={() => { setTotpPending(null); setTotpCode('') }}
              className="w-full py-2 text-xs text-muted-foreground hover:text-navy transition-colors"
            >
              {ta('Back to sign in')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sun className="h-8 w-8 text-gold" />
            <span className="font-display text-xl text-navy">{ta('Admin')}</span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-navy">{ta('Sign In')}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder={ta('Email')} value={email} required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <input
            type="password" placeholder={ta('Password')} value={password} required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="press w-full py-2.5 bg-navy text-silver rounded-lg font-medium hover:bg-navy/90 transition-colors"
          >
            {loading ? ta('Signing in...') : ta('Sign In')}
          </button>
        </form>
      </div>
    </div>
  )
}
