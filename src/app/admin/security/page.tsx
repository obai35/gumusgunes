'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ShieldOff, Copy, Check, KeyRound, AlertTriangle } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type SetupData = { secret: string; qrCode: string; setupToken: string } | null

export default function AdminSecurity() {
  const router = useRouter()
  const [required, setRequired] = useState(false)
  const { user, fetchUser } = useAdminAuth()
  const [step, setStep] = useState<'idle' | 'showSecret' | 'revealCodes'>('idle')
  const [setup, setSetup] = useState<SetupData>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [disableCode, setDisableCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [regenCode, setRegenCode] = useState('')
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const { ta } = useAdminTranslate()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRequired(new URLSearchParams(window.location.search).get('2fa') === 'required')
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push('/admin/login'); return }
    fetch('/api/admin/auth/me')
      .then(r => r.json())
      .then(data => { if (data.admin) setTotpEnabled(!!data.admin.totpEnabled) })
      .catch(() => {})
  }, [user, router, fetchUser])

  async function startSetup() {
    setLoading(true)
    const res = await fetch('/api/admin/auth/setup', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setSetup({ secret: data.secret, qrCode: data.qrCode, setupToken: data.setupToken })
      setStep('showSecret')
    } else {
      const err = await res.json()
      toast.error(err.error || ta('Setup failed'))
    }
    setLoading(false)
  }

  async function verifyTotp() {
    if (!setup) return
    setLoading(true)
    const res = await fetch('/api/admin/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyCode, setupToken: setup.setupToken }),
    })
    if (res.ok) {
      const data = await res.json()
      setBackupCodes(data.backupCodes || [])
      setTotpEnabled(true)
      setStep('revealCodes')
      toast.success(ta('2FA enabled!'))
      fetchUser()
    } else {
      const err = await res.json()
      toast.error(err.error || ta('Verification failed'))
    }
    setLoading(false)
  }

  async function disableTotp() {
    setLoading(true)
    const res = await fetch('/api/admin/auth/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: disableCode, password: disablePassword }),
    })
    if (res.ok) {
      setTotpEnabled(false)
      setDisableCode('')
      setDisablePassword('')
      toast.success(ta('2FA disabled'))
      fetchUser()
    } else {
      const err = await res.json()
      if (err.code === '2FA_POLICY_REQUIRED') toast.error(err.error)
      else toast.error(err.error || ta('Failed to disable'))
    }
    setLoading(false)
  }

  async function regenerateCodes() {
    setLoading(true)
    const res = await fetch('/api/admin/auth/backup-codes/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: regenCode }),
    })
    if (res.ok) {
      const data = await res.json()
      setBackupCodes(data.backupCodes || [])
      setRegenCode('')
      setStep('revealCodes')
      toast.success(ta('New backup codes generated'))
    } else {
      const err = await res.json()
      toast.error(err.error || ta('Failed to regenerate'))
    }
    setLoading(false)
  }

  async function copyAll() {
    await navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">{ta('Security Settings')}</h1>

      {required && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {ta('Two-factor authentication is required for privileged accounts. Set it up to continue.')}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${totpEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              {totpEnabled ? <Shield className="h-5 w-5 text-green-600" /> : <ShieldOff className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <h2 className="font-semibold text-navy">{ta('Two-Factor Authentication')}</h2>
              <p className="text-sm text-muted-foreground">{totpEnabled ? ta('Active') : ta('Not set up')}</p>
            </div>
          </div>
          {!totpEnabled && (
            <button onClick={startSetup} disabled={loading} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
              {loading ? ta('Setting up...') : ta('Set Up')}
            </button>
          )}
        </div>

        {totpEnabled && step === 'idle' && (
          <div className="mb-4">
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {ta('Two-factor authentication is enabled')}
            </div>
          </div>
        )}

        {step === 'showSecret' && setup && (
          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {ta('Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):')}
            </p>
            <div className="flex justify-center">
              {setup.qrCode && <img src={setup.qrCode} alt={ta('QR Code')} className="h-48 w-48 border border-border rounded-lg" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{ta('Or enter this key manually:')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono break-all">{setup.secret}</code>
                <button onClick={() => { navigator.clipboard.writeText(setup.secret); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="p-2 text-muted-foreground hover:text-navy rounded-lg hover:bg-gray-100">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">{ta('Verify with code from app:')}</p>
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" maxLength={6} value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-3 py-2 rounded-lg border border-border text-center text-lg tracking-widest font-mono" placeholder="000000" />
                <button onClick={verifyTotp} disabled={loading || verifyCode.length !== 6} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
                  {loading ? '...' : ta('Verify')}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'revealCodes' && backupCodes.length > 0 && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
              <KeyRound className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{ta('Save these backup codes now. Each can be used once when you lose access to your authenticator app. They will not be shown again.')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map(code => (
                <code key={code} className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono text-center select-all">{code}</code>
              ))}
            </div>
            <button onClick={copyAll} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? ta('Copied!') : ta('Copy All')}
            </button>
            <button onClick={() => { setStep('idle'); setBackupCodes([]) }} className="w-full py-2 text-xs text-muted-foreground hover:text-navy transition-colors">
              {ta('Done')}
            </button>
          </div>
        )}

        {totpEnabled && step === 'idle' && (
          <>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{ta('Regenerate backup codes:')}</p>
              </div>
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" maxLength={6} value={regenCode} onChange={e => setRegenCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-3 py-2 rounded-lg border border-border text-center text-lg tracking-widest font-mono" placeholder="000000" />
                <button onClick={regenerateCodes} disabled={loading || regenCode.length !== 6} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
                  {loading ? '...' : ta('Generate')}
                </button>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">{ta('To disable 2FA, enter the current code and your password:')}</p>
              <input type="text" inputMode="numeric" maxLength={6} value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-3 py-2 rounded-lg border border-border text-center text-lg tracking-widest font-mono" placeholder="000000" />
              <input type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)} placeholder={ta('Password')} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
              <button onClick={disableTotp} disabled={loading || disableCode.length !== 6 || !disablePassword} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
                {loading ? '...' : ta('Disable')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}