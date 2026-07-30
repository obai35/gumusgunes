'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePosAuth } from '@/lib/pos-auth-store'
import { useTranslation } from '@/hooks/use-translation'
import { toast } from 'sonner'
import { Sun } from 'lucide-react'

export default function PosLoginPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/pos/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      usePosAuth.getState().login(data.token, data.user)
      toast.success(t('auth.posLogin.welcomeToast'))
      router.push('/pos')
    } else {
      toast.error(data.error || t('auth.posLogin.loginFailed'))
    }
    setLoading(false)
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
          <h1 className="text-2xl font-display font-semibold text-navy">{t('auth.posLogin.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.posLogin.signInToBranch')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-medium text-navy">{t('auth.posLogin.branchEmail')}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder={t('auth.posLogin.branchEmailPlaceholder')} />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">{t('auth.posLogin.password')}</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder={t('auth.posLogin.passwordPlaceholder')} />
          </div>
          <button type="submit" disabled={loading} className="press w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
            {loading ? t('auth.posLogin.signingIn') : t('auth.posLogin.signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}
