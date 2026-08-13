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
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { ta } = useAdminTranslate()

  async function requestRecovery(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/auth/recovery/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recoveryEmail || totpPending?.email || email }),
    })
    const data = await res.json()
    toast.success(data.message || ta('Recovery email sent'))
    setShowRecovery(false)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body: any = { email, password }
    if (totpPending) {
      const code = totpCode.trim().toUpperCase()
      if (/^\d{6}$/.test(code)) {
        body.totpCode = code
      } else {
        body.backupCode = code
      }
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
            <p className="text-xs text-muted-foreground mt-2">{ta('or a backup code')}</p>
            <p className="text-xs text-muted-foreground mt-1">{email || totpPending.email}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              autoFocus
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.slice(0, 14))}
              className="w-full px-4 py-3 rounded-lg border border-border text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="000000"
              maxLength={14}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || !(/^\d{6}$/.test(totpCode.trim()) || /^([0-9]{2})-[A-Za-z2-9]{5}-[A-Za-z2-9]{5}$/.test(totpCode.trim()))}
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
            <button
              type="button"
              onClick={() => setShowRecovery(v => !v)}
              className="w-full py-1 text-xs text-muted-foreground hover:text-red-600 transition-colors"
            >
              {ta('Lost access to your authenticator app?')}
            </button>
            {showRecovery && (
              <form onSubmit={requestRecovery} className="space-y-2 pt-2 border-t border-border">
                <input
                  type="email"
                  placeholder={ta('Admin email')}
                  value={recoveryEmail || totpPending?.email || email}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {loading ? ta('Sending...') : ta('Send Recovery Link')}
                </button>
              </form>
            )}
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
