'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useHydrated } from '@/hooks/use-hydrated'
import { useFormatPrice } from '@/hooks/use-format-price'
import { formatDate, cn } from '@/lib/format'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, MapPin, CreditCard, Package, Loader2, Plus, Trash2, ChevronRight, Search, X, Key, Chrome } from 'lucide-react'

type Tab = 'profile' | 'addresses' | 'cards' | 'orders'

type Address = {
  id: string
  fullName: string
  phone: string | null
  street: string
  city: string
  state: string | null
  postalCode: string
  country: string
  isDefault: boolean
}

type SavedCard = {
  id: string
  nickname: string | null
  lastFour: string
  expiryMonth: number
  expiryYear: number
}

type Order = {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  paymentMethod: string
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    product: { name: string; imageUrl: string; slug: string }
  }[]
}

const STATUS_MAP: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function TabButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap tab-press',
        active ? 'bg-navy text-silver shadow-md' : 'text-navy/70 hover:bg-secondary hover:text-navy'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

export default function AccountPage() {
  const hydrated = useHydrated()
  const { user, logout, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const formatPrice = useFormatPrice()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [hasPassword, setHasPassword] = useState(true)
  const [hasGoogle, setHasGoogle] = useState(false)
  const [setPwdValue, setSetPwdValue] = useState('')
  const [setPwdLoading, setSetPwdLoading] = useState(false)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState({ fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'EG', isDefault: false })
  const [addressSaving, setAddressSaving] = useState(false)

  const [cards, setCards] = useState<SavedCard[]>([])
  const [cardLoading, setCardLoading] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardForm, setCardForm] = useState({ nickname: '', cardNumber: '', expiryMonth: '', expiryYear: '' })
  const [cardSaving, setCardSaving] = useState(false)

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [trackModal, setTrackModal] = useState<Order | null>(null)

  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrCode: string } | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [totpLoading, setTotpLoading] = useState(false)

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
  }), [])

  useEffect(() => {
    if (!hydrated) return
    if (loading) return
    if (!isAuthenticated()) { router.replace('/login'); return }
    setProfile({ name: user?.name || '', email: user?.email || '', phone: '' })
    fetchProfile()
    fetchAddresses()
    fetchCards()
    fetchOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, loading])

  async function fetchProfile() {
    setProfileLoading(true)
    try {
      const res = await fetch('/api/user/profile', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setProfile({ name: data.name, email: data.email, phone: data.phone || '' })
        setHasPassword(data.hasPassword !== false)
        setHasGoogle(data.hasGoogle === true)
      }
    } finally { setProfileLoading(false) }
  }

  async function saveProfile() {
    setProfileSaving(true)
    try {
      const res = await fetch('/api/user/profile', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ name: profile.name, phone: profile.phone }) })
      if (res.ok) toast.success('Profile updated')
      else toast.error('Failed to update profile')
    } catch { toast.error('Something went wrong') }
    finally { setProfileSaving(false) }
  }

  async function fetchAddresses() {
    setAddressLoading(true)
    try {
      const res = await fetch('/api/user/addresses', { headers: authHeaders() })
      if (res.ok) setAddresses(await res.json())
    } finally { setAddressLoading(false) }
  }

  async function saveAddress() {
    setAddressSaving(true)
    try {
      const url = editingAddress ? `/api/user/addresses/${editingAddress.id}` : '/api/user/addresses'
      const method = editingAddress ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(addressForm) })
      if (res.ok) {
        toast.success(editingAddress ? 'Address updated' : 'Address added')
        setShowAddressForm(false)
        setEditingAddress(null)
        setAddressForm({ fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'EG', isDefault: false })
        fetchAddresses()
      } else toast.error('Failed to save address')
    } catch { toast.error('Something went wrong') }
    finally { setAddressSaving(false) }
  }

  async function deleteAddress(id: string) {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (res.ok) { toast.success('Address deleted'); fetchAddresses() }
    } catch { toast.error('Failed to delete') }
  }

  async function fetchCards() {
    setCardLoading(true)
    try {
      const res = await fetch('/api/user/cards', { headers: authHeaders() })
      if (res.ok) setCards(await res.json())
    } finally { setCardLoading(false) }
  }

  async function saveCard() {
    if (cardForm.cardNumber.length < 4) { toast.error('Enter at least 4 digits'); return }
    setCardSaving(true)
    try {
      const res = await fetch('/api/user/cards', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          nickname: cardForm.nickname || null,
          lastFour: cardForm.cardNumber.slice(-4),
          expiryMonth: parseInt(cardForm.expiryMonth),
          expiryYear: parseInt(cardForm.expiryYear),
        }),
      })
      if (res.ok) {
        toast.success('Card saved')
        setShowCardForm(false)
        setCardForm({ nickname: '', cardNumber: '', expiryMonth: '', expiryYear: '' })
        fetchCards()
      } else toast.error('Failed to save card')
    } catch { toast.error('Something went wrong') }
    finally { setCardSaving(false) }
  }

  async function deleteCard(id: string) {
    try {
      const res = await fetch(`/api/user/cards/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (res.ok) { toast.success('Card removed'); fetchCards() }
    } catch { toast.error('Failed to remove') }
  }

  async function fetchOrders() {
    setOrdersLoading(true)
    try {
      const res = await fetch('/api/user/orders', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
      }
    } finally { setOrdersLoading(false) }
  }

  async function handleEnable2FA() {
    setTotpLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', { headers: authHeaders() })
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
      const res = await fetch('/api/auth/2fa/verify', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ token: totpCode }) })
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

  async function handleSetPassword() {
    setSetPwdLoading(true)
    try {
      const res = await fetch('/api/customer/auth/set-password', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ password: setPwdValue }) })
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

  async function handleDisable2FA() {
    if (totpCode.length !== 6) { toast.error('Enter your current 6-digit code'); return }
    setTotpLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ token: totpCode }) })
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

  if (!hydrated) return null

  if (!isAuthenticated()) return null

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
    { key: 'cards', label: 'Payment Methods', icon: CreditCard },
    { key: 'orders', label: 'Orders', icon: Package },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-silver/30 to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold text-navy">My Account</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, {profile.name || user?.name}</p>
            </div>
            <Button
              onClick={() => { logout(); router.push('/') }}
              variant="outline"
              className="rounded-full text-sm press"
            >
              Sign Out
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => (
              <TabButton key={tab.key} active={activeTab === tab.key} label={tab.label} icon={tab.icon} onClick={() => setActiveTab(tab.key)} />
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-lg">
              {profileLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={profile.email} disabled className="rounded-xl bg-secondary/50 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+90 5XX XXX XXXX" className="rounded-xl" />
                  </div>
                  <Button onClick={saveProfile} disabled={profileSaving} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">
                    {profileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              )}

              {/* Link Google / Set Password */}
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

              {/* Two-Factor Authentication */}
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
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
                <Button onClick={() => { setEditingAddress(null); setAddressForm({ fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'EG', isDefault: false }); setShowAddressForm(true) }} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep text-sm press">
                  <Plus className="h-4 w-4 mr-1" /> Add Address
                </Button>
              </div>

              {showAddressForm && (
                <div className="mb-6 p-5 rounded-2xl border border-border bg-secondary/20 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input value={addressForm.fullName} onChange={(e) => setAddressForm(a => ({ ...a, fullName: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={addressForm.phone} onChange={(e) => setAddressForm(a => ({ ...a, phone: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Street</Label>
                      <Input value={addressForm.street} onChange={(e) => setAddressForm(a => ({ ...a, street: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>City</Label>
                      <Input value={addressForm.city} onChange={(e) => setAddressForm(a => ({ ...a, city: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>State / Region</Label>
                      <Input value={addressForm.state} onChange={(e) => setAddressForm(a => ({ ...a, state: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Postal Code</Label>
                      <Input value={addressForm.postalCode} onChange={(e) => setAddressForm(a => ({ ...a, postalCode: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Country</Label>
                      <Input value={addressForm.country} onChange={(e) => setAddressForm(a => ({ ...a, country: e.target.value }))} className="rounded-xl" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm(a => ({ ...a, isDefault: e.target.checked }))} className="rounded" />
                    Set as default address
                  </label>
                  <div className="flex gap-2">
                    <Button onClick={saveAddress} disabled={addressSaving} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">
                      {addressSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingAddress ? 'Update' : 'Save'} Address
                    </Button>
                    <Button onClick={() => { setShowAddressForm(false); setEditingAddress(null) }} variant="outline" className="rounded-full press">Cancel</Button>
                  </div>
                </div>
              )}

              {addressLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No addresses saved yet</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="p-4 rounded-2xl border border-border bg-white relative">
                      {addr.isDefault && <span className="absolute top-3 right-3 text-[10px] tracking-wider uppercase bg-gold/15 text-gold-soft px-2 py-0.5 rounded-full font-medium">Default</span>}
                      <p className="font-semibold text-navy">{addr.fullName}</p>
                      {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
                      <p className="text-sm text-navy/80 mt-1">{addr.street}</p>
                      <p className="text-sm text-navy/80">{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}</p>
                      <p className="text-sm text-navy/80">{addr.country}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => { setEditingAddress(addr); setAddressForm({ fullName: addr.fullName, phone: addr.phone || '', street: addr.street, city: addr.city, state: addr.state || '', postalCode: addr.postalCode, country: addr.country, isDefault: addr.isDefault }); setShowAddressForm(true) }}
                          className="text-xs text-gold hover:underline"
                        >
                          Edit
                        </button>
                        <button onClick={() => deleteAddress(addr.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'cards' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{cards.length} saved card{cards.length !== 1 ? 's' : ''}</p>
                <Button onClick={() => setShowCardForm(true)} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep text-sm press">
                  <Plus className="h-4 w-4 mr-1" /> Add Card
                </Button>
              </div>

              {showCardForm && (
                <div className="mb-6 p-5 rounded-2xl border border-border bg-secondary/20 space-y-4">
                  <div className="space-y-1.5">
                    <Label>Card Nickname</Label>
                    <Input value={cardForm.nickname} onChange={(e) => setCardForm(c => ({ ...c, nickname: e.target.value }))} placeholder="e.g. My Visa" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Card Number</Label>
                    <Input value={cardForm.cardNumber} onChange={(e) => setCardForm(c => ({ ...c, cardNumber: e.target.value }))} placeholder="1234 5678 9012 3456" maxLength={19} className="rounded-xl font-mono" />
                    <p className="text-xs text-muted-foreground">Only the last 4 digits will be stored</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Expiry Month</Label>
                      <Input value={cardForm.expiryMonth} onChange={(e) => setCardForm(c => ({ ...c, expiryMonth: e.target.value }))} placeholder="MM" maxLength={2} className="rounded-xl font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Expiry Year</Label>
                      <Input value={cardForm.expiryYear} onChange={(e) => setCardForm(c => ({ ...c, expiryYear: e.target.value }))} placeholder="YYYY" maxLength={4} className="rounded-xl font-mono" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveCard} disabled={cardSaving} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">
                      {cardSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Card
                    </Button>
                    <Button onClick={() => setShowCardForm(false)} variant="outline" className="rounded-full press">Cancel</Button>
                  </div>
                </div>
              )}

              {cardLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>
              ) : cards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No saved cards yet</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {cards.map((card) => (
                    <div key={card.id} className="p-4 rounded-2xl border border-border bg-white flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-navy">{card.nickname || 'Card'}</p>
                        <p className="font-mono text-sm text-navy/70">**** {card.lastFour}</p>
                        <p className="text-xs text-muted-foreground">Expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</p>
                      </div>
                      <button onClick={() => deleteCard(card.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>

              {ordersLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 sm:p-5 rounded-2xl border border-border bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="font-mono font-semibold text-navy">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'text-xs font-medium px-3 py-1 rounded-full',
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          )}>
                            {STATUS_MAP[order.status] || order.status}
                          </span>
                          <span className="font-display font-semibold text-navy">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {order.items.slice(0, 4).map((item) => (
                          <div key={item.id} className="h-12 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground font-medium flex-shrink-0">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setTrackModal(order)}
                          className="text-xs flex items-center gap-1 text-gold hover:underline"
                        >
                          <Search className="h-3 w-3" /> Track Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Track Order Modal */}
      {trackModal && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm" onClick={() => setTrackModal(null)} />
          <div className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-navy">Track Order</h3>
              <button onClick={() => setTrackModal(null)} className="p-1 hover:text-gold"><X className="h-5 w-5" /></button>
            </div>
            <p className="font-mono font-medium text-navy mb-4">{trackModal.orderNumber}</p>
            <p className="text-sm text-muted-foreground mb-2">To track this order, check the tracking modal or contact support with your order number.</p>
            <p className="text-xs text-muted-foreground">You can also use the Track Order feature from the header for real-time updates.</p>
          </div>
        </div>
      )}
    </>
  )
}
