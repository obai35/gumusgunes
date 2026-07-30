'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/use-translation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!email) newErrors.email = t('auth.forgotPassword.emailRequired')
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
        toast.success(t('auth.forgotPassword.checkEmail'))
      } else {
        const data = await res.json()
        toast.error(data.error || t('auth.forgotPassword.somethingWentWrong'))
      }
    } catch {
      toast.error(t('auth.forgotPassword.somethingWentWrong'))
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-display font-semibold text-navy">{t('auth.forgotPassword.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.forgotPassword.description')}</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm text-navy font-medium mb-2">{t('auth.forgotPassword.emailSent')}</p>
            <p className="text-xs text-muted-foreground mb-4">{t('auth.forgotPassword.emailSentDesc', email)}</p>
            <Link href="/login" className="text-sm text-gold hover:underline font-medium">{t('auth.forgotPassword.backToSignIn')}</Link>
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
                {t('auth.forgotPassword.email')}
              </span>
              {errors.email && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.email}</p>}
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('auth.forgotPassword.sendReset')}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/login" className="inline-flex items-center gap-1 text-gold hover:text-gold/80 font-medium">
                <ArrowLeft className="h-3 w-3" /> {t('auth.forgotPassword.backToSignIn')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
