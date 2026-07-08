'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return new URLSearchParams(window.location.search).get('token') || ''
    return ''
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { toast.error('Invalid reset link'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      })
      if (res.ok) {
        setDone(true)
        toast.success('Password reset successfully')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to reset password')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-display font-semibold text-navy mb-4">Invalid Link</h1>
          <p className="text-sm text-muted-foreground mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="text-gold hover:underline font-medium">Request a new reset link</Link>
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
          <h1 className="text-2xl font-display font-semibold text-navy">Set New Password</h1>
        </div>

        {done ? (
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm text-navy font-medium mb-2">Password Updated</p>
            <p className="text-xs text-muted-foreground mb-4">Your password has been reset successfully.</p>
            <Link href="/login" className="text-sm text-gold hover:underline font-medium">Sign in with your new password</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
            <label className="relative block">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })) }}
                className={cn(
                  "peer w-full rounded-lg border px-3 pt-5 pb-2.5 text-sm outline-none transition-colors",
                  errors.email ? "border-red-500 animate-shake" : "border-border focus:border-gold"
                )}
                placeholder=" "
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.email ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                Email
              </span>
              {errors.email && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.email}</p>}
            </label>
            <div className="relative block">
              <input
                id="reset-password-input"
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { 
                  const val = e.target.value
                  setPassword(val)
                  let err = ''
                  if (val.length > 0 && val.length < 8) err = 'At least 8 characters'
                  else if (val.length > 0 && !/[a-z]/.test(val)) err = 'Must include a lowercase letter'
                  else if (val.length > 0 && !/[A-Z]/.test(val)) err = 'Must include an uppercase letter'
                  else if (val.length > 0 && !/[0-9]/.test(val)) err = 'Must include a digit'
                  setErrors(prev => ({ ...prev, password: err }))
                }}
                className={cn(
                  "peer w-full rounded-lg border px-3 pt-5 pb-2.5 pr-10 text-sm outline-none transition-colors",
                  errors.password ? "border-red-500 animate-shake" : "border-border focus:border-gold"
                )}
                placeholder=" "
                minLength={8}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy z-10">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <label htmlFor="reset-password-input" className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.password ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                New Password
              </label>
              {errors.password && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || !!errors.password || !password}
              className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
