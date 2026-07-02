'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Shield, Smartphone, Copy, Check } from 'lucide-react'

export default function SecurityPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'showSecret' | 'verify'>('idle')
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
  }, [user, router])

  async function setup2fa() {
    setLoading(true)
    const res = await fetch('/api/auth/2fa/setup')
    if (res.ok) {
      const data = await res.json()
      setSecret(data.secret)
      setQrCode(data.qrCode)
      setStep('showSecret')
    } else {
      const err = await res.json()
      if (err.error === '2FA already enabled') { setTotpEnabled(true); setStep('idle') }
      else toast.error(err.error || 'Failed to set up 2FA')
    }
    setLoading(false)
  }

  async function verify2fa() {
    setLoading(true)
    const res = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyCode }),
    })
    if (res.ok) { toast.success('2FA enabled!'); setTotpEnabled(true); setStep('idle'); setVerifyCode('') }
    else { const err = await res.json(); toast.error(err.error || 'Invalid code') }
    setLoading(false)
  }

  async function disable2fa() {
    setLoading(true)
    const res = await fetch('/api/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: disableCode }),
    })
    if (res.ok) { toast.success('2FA disabled'); setTotpEnabled(false); setStep('idle'); setDisableCode('') }
    else { const err = await res.json(); toast.error(err.error || 'Invalid code') }
    setLoading(false)
  }

  function copySecret() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-gold" />
          <div>
            <h1 className="text-2xl font-display font-semibold text-navy">Security Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account security</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-navy" />
              <div>
                <p className="font-medium text-navy">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">{totpEnabled ? 'Enabled' : 'Not set up'}</p>
              </div>
            </div>
            {!totpEnabled && step === 'idle' && (
              <button onClick={setup2fa} disabled={loading} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
                {loading ? 'Loading...' : 'Set Up'}
              </button>
            )}
            {totpEnabled && (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Active</span>
            )}
          </div>

          {step === 'showSecret' && (
            <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium text-navy">Scan this QR code with your authenticator app:</p>
              {qrCode && <img src={qrCode} alt="2FA QR Code" className="mx-auto w-48 h-48" />}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Or enter this key manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-border rounded text-xs font-mono break-all">{secret}</code>
                  <button onClick={copySecret} className="p-2 hover:bg-gray-100 rounded transition-colors">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-navy">Verify with code from app</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" inputMode="numeric" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-3 py-2 rounded-lg border border-border text-sm text-center tracking-[0.3em] font-mono" placeholder="000000" maxLength={6} />
                  <button onClick={verify2fa} disabled={verifyCode.length !== 6 || loading} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">Verify</button>
                </div>
              </div>
            </div>
          )}

          {totpEnabled && (
            <div className="p-4 bg-red-50 rounded-lg space-y-3">
              <p className="text-sm font-medium text-red-700">To disable 2FA, enter a code from your authenticator app:</p>
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-sm text-center tracking-[0.3em] font-mono" placeholder="000000" maxLength={6} />
                <button onClick={disable2fa} disabled={disableCode.length !== 6 || loading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">Disable</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
