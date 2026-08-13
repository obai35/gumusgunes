'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, KeyRound, CheckCircle2, XCircle } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function AdminRecovery() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'loading' | 'form' | 'done' | 'error'>('loading')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { ta } = useAdminTranslate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token') || ''
    const e = params.get('email') || ''
    setToken(t)
    setEmail(e)
    setState(t && e ? 'form' : 'error')
  }, [])

  async function confirmRecovery(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth/recovery/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email }),
    })
    const data = await res.json()
    if (res.ok) {
      setState('done')
    } else {
      setError(data.error || ta('Recovery failed'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-navy-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sun className="h-8 w-8 text-gold" />
            <span className="font-display text-xl text-navy">{ta('Admin')}</span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-navy">{ta('Account Recovery')}</h1>
        </div>

        {state === 'loading' && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
          </div>
        )}

        {state === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-sm text-muted-foreground">{ta('This recovery link is incomplete or invalid.')}</p>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full py-2.5 bg-navy text-silver rounded-lg font-medium hover:bg-navy/90 transition-colors"
            >
              {ta('Back to sign in')}
            </button>
          </div>
        )}

        {state === 'form' && (
          <form onSubmit={confirmRecovery} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <KeyRound className="h-4 w-4 shrink-0" />
              <span>{ta('This will disable two-factor authentication for:')} <strong>{email}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground">
              {ta('Confirm to reset. You will be asked to set up 2FA again at the next sign in.')}
            </p>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy text-silver rounded-lg font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {loading ? ta('Recovering...') : ta('Confirm Recovery')}
            </button>
          </form>
        )}

        {state === 'done' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <p className="text-sm text-muted-foreground">{ta('Two-factor authentication has been disabled. Log in now and set it up again.')}</p>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full py-2.5 bg-navy text-silver rounded-lg font-medium hover:bg-navy/90 transition-colors"
            >
              {ta('Back to sign in')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}