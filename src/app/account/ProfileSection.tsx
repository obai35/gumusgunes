'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Loader2, Chrome, Key } from 'lucide-react'

export function ProfileSection() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [hasPassword, setHasPassword] = useState(true)
  const [hasGoogle, setHasGoogle] = useState(false)
  const [setPwdValue, setSetPwdValue] = useState('')
  const [setPwdLoading, setSetPwdLoading] = useState(false)

  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrCode: string } | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [totpLoading, setTotpLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', email: user.email || '', phone: '' })
    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchProfile() {
    setProfileLoading(true)
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile({ name: data.name, email: data.email, phone: data.phone || '' })
        setHasPassword(data.hasPassword !== false)
        setHasGoogle(data.hasGoogle === true)
      }
    } finally { setProfileLoading(false) }
  }

  async function saveProfile() {
    const newErrors: Record<string, string> = {}
    if (!profile.name.trim()) newErrors.name = 'Name is required'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setProfileSaving(true)
    try {
      const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profile.name, phone: profile.phone }) })
      if (res.ok) toast.success('Profile updated')
      else toast.error('Failed to update profile')
    } catch { toast.error('Something went wrong') }
    finally { setProfileSaving(false) }
  }

  async function handleEnable2FA() {
    setTotpLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup')
      if (res.ok) {
        const data = await res.json()
        setTotpSetup({ secret: data.secret, qrCode: data.qrCode })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to start 2FA setup')
      }
    } catch { toast.error('Something went wrong') }
    finally { setTotpLoading(false) }
  }

  async function handleVerify2FA() {
    if (totpCode.length !== 6) { toast.error('Enter a valid 6-digit code'); return }
    setTotpLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: totpCode }) })
      if (res.ok) {
        toast.success('Two-factor authentication enabled')
        setTotpEnabled(true)
        setTotpSetup(null)
        setTotpCode('')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Invalid code')
      }
    } catch { toast.error('Something went wrong') }
    finally { setTotpLoading(false) }
  }

  async function handleDisable2FA() {
    if (totpCode.length !== 6) { toast.error('Enter your current 6-digit code'); return }
    setTotpLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: totpCode }) })
      if (res.ok) {
        toast.success('Two-factor authentication disabled')
        setTotpEnabled(false)
        setTotpCode('')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to disable 2FA')
      }
    } catch { toast.error('Something went wrong') }
    finally { setTotpLoading(false) }
  }

  async function handleSetPassword() {
    setSetPwdLoading(true)
    try {
      const res = await fetch('/api/customer/auth/set-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: setPwdValue }) })
      if (res.ok) {
        toast.success('Password set! You can now sign in with email as well.')
        setHasPassword(true)
        setSetPwdValue('')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to set password')
      }
    } catch { toast.error('Something went wrong') }
    finally { setSetPwdLoading(false) }
  }

  async function handleLinkGoogle() {
    window.location.href = '/api/customer/auth/google'
  }

  if (profileLoading) {
    return (
      <div className="max-w-lg space-y-5">
        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full rounded-xl" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full rounded-xl" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full rounded-xl" /></div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="space-y-5">
        <label className="relative block">
          <Input
            value={profile.name}
            onChange={(e) => { setProfile(p => ({ ...p, name: e.target.value })); setErrors(prev => ({ ...prev, name: '' })) }}
            className={cn("peer rounded-xl pt-5", errors.name ? "border-red-500 animate-shake" : "")}
            placeholder=" "
          />
          <span className={cn(
            "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
            errors.name ? "text-red-500" : "text-muted-foreground",
            "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
            "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
          )}>
            Name
          </span>
          {errors.name && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.name}</p>}
        </label>
        <label className="relative block">
          <Input value={profile.email} disabled className="peer rounded-xl pt-5 bg-secondary/50" placeholder=" " />
          <span className="absolute left-3 top-1.5 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold">
            Email
          </span>
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </label>
        <label className="relative block">
          <Input
            value={profile.phone}
            onChange={(e) => { setProfile(p => ({ ...p, phone: e.target.value })); setErrors(prev => ({ ...prev, phone: '' })) }}
            className={cn("peer rounded-xl pt-5", errors.phone ? "border-red-500 animate-shake" : "")}
            placeholder=" "
          />
          <span className={cn(
            "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
            errors.phone ? "text-red-500" : "text-muted-foreground",
            "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
            "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
          )}>
            Phone
          </span>
          {errors.phone && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.phone}</p>}
        </label>
        <Button onClick={saveProfile} disabled={profileSaving} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">
          {profileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="mt-8 p-5 rounded-2xl border border-border bg-white space-y-4">
        <h3 className="font-display text-lg font-semibold text-navy">Account Linking</h3>
        {!hasGoogle && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy">Link Google Account</p>
              <p className="text-xs text-muted-foreground">Sign in with Google as well as email</p>
            </div>
            <Button onClick={handleLinkGoogle} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press flex-shrink-0 text-sm">
              <Chrome className="h-4 w-4 mr-1.5" /> Link Google
            </Button>
          </div>
        )}
        {hasGoogle && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy">Google Account</p>
              <p className="text-xs text-green-600">Linked</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Connected</span>
          </div>
        )}
        {!hasPassword && (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-navy mb-1">Set Password</p>
            <p className="text-xs text-muted-foreground mb-3">You signed up via Google. Set a password to also sign in with email.</p>
            <div className="flex gap-2">
              <Input type="password" value={setPwdValue} onChange={(e) => setSetPwdValue(e.target.value)} placeholder="New password" className="rounded-xl" />
              <Button onClick={handleSetPassword} disabled={setPwdLoading || setPwdValue.length < 8} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press flex-shrink-0">
                {setPwdLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Set
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-5 rounded-2xl border border-border bg-white">
        <h3 className="font-display text-lg font-semibold text-navy mb-1">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account.</p>

        {totpSetup ? (
          <div>
            <img src={totpSetup.qrCode} alt="Scan with authenticator app" className="mx-auto mb-3 w-48 h-48" />
            <p className="text-xs text-muted-foreground text-center mb-3">Scan this QR code with Google Authenticator or similar app.</p>
            <div className="flex gap-2">
              <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" maxLength={6} className="rounded-xl font-mono text-center" />
              <Button onClick={handleVerify2FA} disabled={totpLoading || totpCode.length !== 6} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press flex-shrink-0">
                {totpLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Verify & Enable
              </Button>
            </div>
          </div>
        ) : totpEnabled ? (
          <div>
            <p className="text-sm mb-3">Two-factor authentication is <span className="text-green-600 font-medium">Enabled</span></p>
            <div className="flex gap-2">
              <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" maxLength={6} className="rounded-xl font-mono text-center" />
              <Button onClick={handleDisable2FA} disabled={totpLoading || totpCode.length !== 6} variant="outline" className="rounded-full text-red-500 border-red-200 hover:bg-red-50 press flex-shrink-0">
                {totpLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Disable
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm mb-3">Two-factor authentication is <span className="text-muted-foreground">Disabled</span></p>
            <Button onClick={handleEnable2FA} disabled={totpLoading} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">
              {totpLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enable 2FA
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
