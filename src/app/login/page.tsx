'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-store'
import { useTranslation } from '@/hooks/use-translation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { login, totpPending, setTotpPending } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [totpEmail, setTotpEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (totpPending) setTotpEmail(totpPending.email)
  }, [totpPending])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!email) newErrors.email = t('auth.login.emailRequired')
    if (!password) newErrors.password = t('auth.login.passwordRequired')
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
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
      toast.success(t('auth.login.welcomeBackToast'))
      router.push('/')
    } else if (data.totpRequired) {
      setTotpPending({ userId: data.userId, email: email || totpEmail })
      setLoading(false)
      return
    } else {
      toast.error(data.error || t('auth.login.loginFailed'))
    }
    setLoading(false)
  }

  if (totpPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-semibold text-navy">{t('auth.login.twoFactor')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('auth.login.enterCode')}</p>
            <p className="text-xs text-muted-foreground mt-2">{totpEmail}</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
            <div>
              <label className="text-sm font-medium text-navy">{t('auth.login.authCode')}</label>
              <input type="text" inputMode="numeric" autoFocus required value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1 text-center text-2xl tracking-[0.3em] font-mono" placeholder={t('auth.login.authCodePlaceholder')} maxLength={6} />
            </div>
            <button type="submit" disabled={loading || totpCode.length !== 6} className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
              {loading ? t('auth.login.verifying') : t('auth.login.verify')}
            </button>
            <button type="button" onClick={() => setTotpPending(null)} className="w-full py-2 text-xs text-muted-foreground hover:text-navy transition-colors">{t('auth.login.backToSignIn')}</button>
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
          <h1 className="text-2xl font-display font-semibold text-navy">{t('auth.login.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.login.welcomeBack')}</p>
        </div>

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
              {t('auth.login.email')}
            </span>
            {errors.email && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.email}</p>}
          </label>
          <label className="relative block">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })) }}
              className={cn(
                "peer w-full rounded-lg border px-3 pt-5 pb-2.5 text-sm outline-none transition-colors",
                errors.password ? "border-red-500 animate-shake" : "border-border focus:border-gold"
              )}
              placeholder=" "
            />
            <span className={cn(
              "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
              errors.password ? "text-red-500" : "text-muted-foreground",
              "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
              "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
            )}>
              {t('auth.login.password')}
            </span>
            {errors.password && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.password}</p>}
          </label>
          <Link href="/forgot-password" className="text-xs text-gold hover:text-gold/80 font-medium mt-1 inline-block">{t('auth.login.forgotPassword')}</Link>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
            {loading ? t('auth.login.signingIn') : t('auth.login.title')}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-muted-foreground">{t('auth.login.orContinueWith')}</span></div>
          </div>
          <a href="/api/customer/auth/google" className="flex items-center justify-center gap-3 w-full py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t('auth.login.continueWithGoogle')}
          </a>
          <p className="text-center text-xs text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <Link href="/register" className="text-gold hover:text-gold/80 font-medium">{t('auth.login.createOne')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
