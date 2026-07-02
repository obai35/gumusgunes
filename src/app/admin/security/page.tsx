'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ShieldOff, Smartphone, Copy, Check } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { toast } from 'sonner'

export default function AdminSecurity() {
  const router = useRouter()
  const { user, logout } = useAdminAuth()
  const [step, setStep] = useState<'idle' | 'showSecret' | 'verify'>('idle')
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/admin/login'); return }
    fetch('/api/admin/auth/me')
      .then(r => r.json())
      .then(data => { if (data.admin) setTotpEnabled(data.admin.totpEnabled) })
      .catch(() => {})
  }, [user, router])

  async function startSetup() {
    setLoading(true)
    const res = await fetch('/api/admin/auth/setup')
    if (res.ok) {
      const data = await res.json()
      setSecret(data.secret)
      setQrCode(data.qrCode)
      setStep('showSecret')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Setup failed')
    }
    setLoading(false)
  }

  async function verifyTotp() {
    setLoading(true)
    const res = await fetch('/api/admin/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyCode }),
    })
    if (res.ok) {
      setTotpEnabled(true)
      setStep('idle')
      toast.success('2FA enabled!')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Verification failed')
    }
    setLoading(false)
  }

  async function disableTotp() {
    setLoading(true)
    const res = await fetch('/api/admin/auth/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: disableCode }),
    })
    if (res.ok) {
      setTotpEnabled(false)
      setDisableCode('')
      toast.success('2FA disabled')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to disable')
    }
    setLoading(false)
  }

  function copySecret() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Security Settings</h1>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${totpEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              {totpEnabled ? <Shield className="h-5 w-5 text-green-600" /> : <ShieldOff className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <h2 className="font-semibold text-navy">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground">{totpEnabled ? 'Active' : 'Not set up'}</p>
            </div>
          </div>
          {!totpEnabled && (
            <button onClick={startSetup} disabled={loading} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
              {loading ? 'Setting up...' : 'Set Up'}
            </button>
          )}
        </div>

        {totpEnabled && (
          <div className="mb-4">
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Two-factor authentication is enabled
            </div>
          </div>
        )}

        {step === 'showSecret' && (
          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>
            <div className="flex justify-center">
              {qrCode && <img src={qrCode} alt="QR Code" className="h-48 w-48 border border-border rounded-lg" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Or enter this key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono break-all">{secret}</code>
                <button onClick={copySecret} className="p-2 text-muted-foreground hover:text-navy rounded-lg hover:bg-gray-100">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Verify with code from app:</p>
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" maxLength={6} value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-3 py-2 rounded-lg border border-border text-center text-lg tracking-widest font-mono" placeholder="000000" />
                <button onClick={verifyTotp} disabled={loading || verifyCode.length !== 6} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
                  {loading ? '...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show disable section when totp is enabled and we're not in setup */}
        {totpEnabled && step === 'idle' && (
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">To disable 2FA, enter the current code from your authenticator app:</p>
            <div className="flex gap-2">
              <input type="text" inputMode="numeric" maxLength={6} value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-3 py-2 rounded-lg border border-border text-center text-lg tracking-widest font-mono" placeholder="000000" />
              <button onClick={disableTotp} disabled={loading || disableCode.length !== 6} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
                {loading ? '...' : 'Disable'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
