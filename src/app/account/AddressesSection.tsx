'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { MapPin, Plus, Loader2 } from 'lucide-react'

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

const emptyForm = { fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'EG', isDefault: false }

export function AddressesSection() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState(emptyForm)
  const [addressSaving, setAddressSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { fetchAddresses() }, [])

  async function fetchAddresses() {
    setAddressLoading(true)
    try {
      const res = await fetch('/api/user/addresses')
      if (res.ok) setAddresses(await res.json())
    } finally { setAddressLoading(false) }
  }

  async function saveAddress() {
    const newErrors: Record<string, string> = {}
    if (!addressForm.fullName.trim()) newErrors.fullName = 'Name is required'
    if (!addressForm.street.trim()) newErrors.street = 'Street is required'
    if (!addressForm.city.trim()) newErrors.city = 'City is required'
    if (!addressForm.postalCode.trim()) newErrors.postalCode = 'Postal code is required'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setAddressSaving(true)
    try {
      const url = editingAddress ? `/api/user/addresses/${editingAddress.id}` : '/api/user/addresses'
      const method = editingAddress ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addressForm) })
      if (res.ok) {
        toast.success(editingAddress ? 'Address updated' : 'Address added')
        setShowAddressForm(false)
        setEditingAddress(null)
        setAddressForm(emptyForm)
        fetchAddresses()
      } else toast.error('Failed to save address')
    } catch { toast.error('Something went wrong') }
    finally { setAddressSaving(false) }
  }

  async function deleteAddress(id: string) {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Address deleted'); fetchAddresses() }
    } catch { toast.error('Failed to delete') }
  }

  function startEdit(addr: Address) {
    setErrors({})
    setEditingAddress(addr)
    setAddressForm({ fullName: addr.fullName, phone: addr.phone || '', street: addr.street, city: addr.city, state: addr.state || '', postalCode: addr.postalCode, country: addr.country, isDefault: addr.isDefault })
    setShowAddressForm(true)
  }

  function startAdd() {
    setErrors({})
    setEditingAddress(null)
    setAddressForm(emptyForm)
    setShowAddressForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        <Button onClick={startAdd} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep text-sm press">
          <Plus className="h-4 w-4 mr-1" /> Add Address
        </Button>
      </div>

      {showAddressForm && (
        <div className="mb-6 p-5 rounded-2xl border border-border bg-secondary/20 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="relative block">
              <Input
                value={addressForm.fullName}
                onChange={(e) => { setAddressForm(a => ({ ...a, fullName: e.target.value })); setErrors(prev => ({ ...prev, fullName: '' })) }}
                className={cn("peer rounded-xl pt-5", errors.fullName ? "border-red-500 animate-shake" : "")}
                placeholder=" "
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.fullName ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                Full Name
              </span>
              {errors.fullName && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.fullName}</p>}
            </label>
            <label className="relative block">
              <Input
                value={addressForm.phone}
                onChange={(e) => { setAddressForm(a => ({ ...a, phone: e.target.value })); setErrors(prev => ({ ...prev, phone: '' })) }}
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
            <label className="relative block sm:col-span-2">
              <Input
                value={addressForm.street}
                onChange={(e) => { setAddressForm(a => ({ ...a, street: e.target.value })); setErrors(prev => ({ ...prev, street: '' })) }}
                className={cn("peer rounded-xl pt-5", errors.street ? "border-red-500 animate-shake" : "")}
                placeholder=" "
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.street ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                Street
              </span>
              {errors.street && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.street}</p>}
            </label>
            <label className="relative block">
              <Input
                value={addressForm.city}
                onChange={(e) => { setAddressForm(a => ({ ...a, city: e.target.value })); setErrors(prev => ({ ...prev, city: '' })) }}
                className={cn("peer rounded-xl pt-5", errors.city ? "border-red-500 animate-shake" : "")}
                placeholder=" "
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.city ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                City
              </span>
              {errors.city && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.city}</p>}
            </label>
            <label className="relative block">
              <Input
                value={addressForm.state}
                onChange={(e) => { setAddressForm(a => ({ ...a, state: e.target.value })); setErrors(prev => ({ ...prev, state: '' })) }}
                className={cn("peer rounded-xl pt-5", errors.state ? "border-red-500 animate-shake" : "")}
                placeholder=" "
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.state ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                State / Region
              </span>
              {errors.state && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.state}</p>}
            </label>
            <label className="relative block">
              <Input
                value={addressForm.postalCode}
                onChange={(e) => { setAddressForm(a => ({ ...a, postalCode: e.target.value })); setErrors(prev => ({ ...prev, postalCode: '' })) }}
                className={cn("peer rounded-xl pt-5", errors.postalCode ? "border-red-500 animate-shake" : "")}
                placeholder=" "
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.postalCode ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                Postal Code
              </span>
              {errors.postalCode && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.postalCode}</p>}
            </label>
            <label className="relative block">
              <Input
                value={addressForm.country}
                onChange={(e) => { setAddressForm(a => ({ ...a, country: e.target.value })); setErrors(prev => ({ ...prev, country: '' })) }}
                className={cn("peer rounded-xl pt-5", errors.country ? "border-red-500 animate-shake" : "")}
                placeholder=" "
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.country ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                Country
              </span>
              {errors.country && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.country}</p>}
            </label>
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
            <Button onClick={() => { setShowAddressForm(false); setEditingAddress(null); setErrors({}) }} variant="outline" className="rounded-full press">Cancel</Button>
          </div>
        </div>
      )}

      {addressLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-border bg-white space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-40 mt-2" />
              <Skeleton className="h-3 w-36" />
              <div className="flex gap-3 mt-3 pt-3 border-t border-border/50"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-14" /></div>
            </div>
          ))}
        </div>
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
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                <button onClick={() => startEdit(addr)} className="text-xs text-gold hover:underline font-medium">Edit</button>
                <button onClick={() => deleteAddress(addr.id)} className="text-xs text-red-500 hover:underline font-medium">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
