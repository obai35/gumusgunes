# Phase 10: Internationalization

## Models (Prisma Schema)

Add these models to `prisma/schema.prisma`:

```prisma
model Currency {
  id           String   @id @default(cuid())
  code         String   @unique
  name         String
  symbol       String
  exchangeRate Float
  isDefault    Boolean  @default(false)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Translation {
  id        String   @id @default(cuid())
  key       String   @unique
  en        String
  ar        String
  group     String   @default("general")
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}

model TaxRate {
  id        String   @id @default(cuid())
  name      String
  rate      Float
  country   String   @default("EG")
  region    String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run: `npx prisma migrate dev --name add-i18n`

---

## 1. Seed Default Currencies

**File:** `prisma/seed.ts` — Add to the seed function:

Add after `const GENDER = ['MALE', 'FEMALE']`:

```typescript
import { db } from '../src/lib/db'

// Inside main seed function:
async function seedCurrencies() {
  const currencies = [
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', exchangeRate: 1, isDefault: true, isActive: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.0208, isDefault: false, isActive: true },
    { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.0192, isDefault: false, isActive: true },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', exchangeRate: 0.718, isDefault: false, isActive: true },
  ]
  for (const c of currencies) {
    await db.currency.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    })
  }
  console.log('  ✓ Currencies seeded')
}
```

Call `seedCurrencies()` in the seed sequence.

---

## 2. Currency API Routes

**File:** `src/app/api/admin/currencies/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  try {
    const currencies = await db.currency.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, currencies })
  } catch (err) {
    console.error('GET /api/admin/currencies error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { code, name, symbol, exchangeRate, isDefault, isActive } = await req.json()
    if (!code || !name || !symbol || exchangeRate == null) {
      return NextResponse.json({ error: 'code, name, symbol, exchangeRate required' }, { status: 400 })
    }
    if (isDefault) {
      await db.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }
    const currency = await db.currency.create({ data: { code, name, symbol, exchangeRate, isDefault: isDefault || false, isActive: isActive ?? true } })
    return NextResponse.json({ ok: true, currency })
  } catch (err) {
    console.error('POST /api/admin/currencies error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { id, code, name, symbol, exchangeRate, isDefault, isActive } = await req.json()
    const data: any = {}
    if (code !== undefined) data.code = code
    if (name !== undefined) data.name = name
    if (symbol !== undefined) data.symbol = symbol
    if (exchangeRate !== undefined) data.exchangeRate = exchangeRate
    if (isActive !== undefined) data.isActive = isActive
    if (isDefault) {
      await db.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
      data.isDefault = true
    }
    const currency = await db.currency.update({ where: { id }, data })
    return NextResponse.json({ ok: true, currency })
  } catch (err) {
    console.error('PUT /api/admin/currencies error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { id } = await req.json()
    const currency = await db.currency.findUnique({ where: { id } })
    if (!currency) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (currency.isDefault) return NextResponse.json({ error: 'Cannot delete default currency' }, { status: 400 })
    await db.currency.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/currencies error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')
```

---

## 3. Currency Admin Page

**File:** `src/app/admin/currencies/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', symbol: '', exchangeRate: '', isDefault: false, isActive: true })

  useEffect(() => {
    fetch('/api/admin/currencies').then(r => r.json()).then(d => {
      if (d.ok) setCurrencies(Array.isArray(d.currencies) ? d.currencies : [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const rate = parseFloat(form.exchangeRate)
    if (!form.code || !form.name || !form.symbol || isNaN(rate) || rate <= 0) {
      return toast.error('All fields required, exchange rate must be positive')
    }
    const url = '/api/admin/currencies'
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { ...form, id: editing, exchangeRate: rate } : { ...form, exchangeRate: rate }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      toast.success(editing ? 'Currency updated' : 'Currency created')
      const data = await res.json()
      if (editing) {
        setCurrencies(currencies.map(c => c.id === editing ? data.currency : c))
      } else {
        setCurrencies([data.currency, ...currencies])
      }
      setShowForm(false); setEditing(null)
      setForm({ code: '', name: '', symbol: '', exchangeRate: '', isDefault: false, isActive: true })
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  function editCurrency(c: any) {
    setForm({ code: c.code, name: c.name, symbol: c.symbol, exchangeRate: String(c.exchangeRate), isDefault: c.isDefault, isActive: c.isActive })
    setEditing(c.id)
    setShowForm(true)
  }

  async function setDefault(c: any) {
    const res = await fetch('/api/admin/currencies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, isDefault: true }),
    })
    if (res.ok) {
      setCurrencies(currencies.map(curr => ({ ...curr, isDefault: curr.id === c.id })))
      toast.success(`Default currency set to ${c.code}`)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  async function deleteCurrency(id: string) {
    if (!confirm('Delete this currency?')) return
    const res = await fetch('/api/admin/currencies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setCurrencies(currencies.filter(c => c.id !== id))
      toast.success('Currency deleted')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  if (loading) return <div className="p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Currencies</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ code: '', name: '', symbol: '', exchangeRate: '', isDefault: false, isActive: true }) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Add Currency'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-border p-5 mb-6 max-w-lg space-y-3">
          <h3 className="font-semibold text-navy">{editing ? 'Edit Currency' : 'New Currency'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Code</label><input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EGP" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Symbol</label><input required value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="E£" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Exchange Rate</label><input required type="number" step="0.0001" value={form.exchangeRate} onChange={e => setForm({ ...form, exchangeRate: e.target.value })} placeholder="1" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Egyptian Pound" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          <div className="flex gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rate (vs EGP)</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Default</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono font-bold text-navy">{c.code}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.symbol}</td>
                <td className="px-4 py-3 font-mono text-navy">{c.exchangeRate}</td>
                <td className="px-4 py-3">{c.isDefault ? <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold font-medium">Default</span> : <button onClick={() => setDefault(c)} className="text-xs text-muted-foreground hover:text-navy">Set default</button>}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => editCurrency(c)} className="text-gold hover:text-gold/80 text-xs font-medium">Edit</button>
                  {!c.isDefault && <button onClick={() => deleteCurrency(c.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>}
                </td>
              </tr>
            ))}
            {currencies.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No currencies yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## 4. Storefront Currency Selector

**File:** `src/lib/format.ts` — Replace the static `CURRENCIES` with a dynamic loader:

Replace the entire file content:

```typescript
export type LocaleCode = 'en' | 'ar'

export function getCurrencyMeta(code: string) {
  return null // runtime fetch
}

export function formatPrice(value: number, currencyCode: string = 'EGP', symbol: string = 'E£', locale: string = 'ar-EG'): string {
  const converted = value * 1
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted)
}

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch { return [] }
}

export function parseImages(images: string | null | undefined): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch { return [] }
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date))
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  const KEY = 'gg_session_id'
  let id = window.localStorage.getItem(KEY)
  if (!id) {
    id = 'sess_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16) + Date.now().toString(36)
    window.localStorage.setItem(KEY, id)
  }
  return id
}

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}
```

**File:** `src/lib/currency-store.ts`

```typescript
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CurrencyInfo = {
  code: string
  name: string
  symbol: string
  exchangeRate: number
  isDefault: boolean
}

type CurrencyStore = {
  currencies: CurrencyInfo[]
  selected: CurrencyInfo
  loading: boolean
  setSelected: (code: string) => void
  loadCurrencies: () => Promise<void>
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currencies: [],
      selected: { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', exchangeRate: 1, isDefault: true },
      loading: true,
      setSelected: (code: string) => {
        const found = get().currencies.find(c => c.code === code) || get().currencies[0] || get().selected
        set({ selected: found })
      },
      loadCurrencies: async () => {
        try {
          const res = await fetch('/api/admin/currencies')
          const data = await res.json()
          if (data.ok && Array.isArray(data.currencies)) {
            const active = data.currencies.filter((c: any) => c.isActive)
            const defaults = active.filter((c: any) => c.isDefault)
            set({ currencies: active, selected: defaults[0] || active[0] || get().selected, loading: false })
          }
        } catch { set({ loading: false }) }
      },
    }),
    { name: 'gg_currency', partialize: (state) => ({ selected: state.selected }) }
  )
)

export function formatConvertedPrice(priceInEgp: number, currency: { exchangeRate: number; symbol: string; code: string }): string {
  const converted = priceInEgp * currency.exchangeRate
  const localeMap: Record<string, string> = { EGP: 'ar-EG', USD: 'en-US', EUR: 'de-DE', TRY: 'tr-TR' }
  const locale = localeMap[currency.code] || 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.code === 'TRY' ? 0 : 2,
    maximumFractionDigits: currency.code === 'TRY' ? 0 : 2,
  }).format(converted)
}
```

---

## 5. Translation API Routes

**File:** `src/app/api/admin/translations/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  try {
    const translations = await db.translation.findMany({ orderBy: { updatedAt: 'desc' } })
    return NextResponse.json({ ok: true, translations })
  } catch (err) {
    console.error('GET /api/admin/translations error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { key, en, ar, group } = await req.json()
    if (!key || en == null || ar == null) return NextResponse.json({ error: 'key, en, ar required' }, { status: 400 })
    const existing = await db.translation.findUnique({ where: { key } })
    if (existing) return NextResponse.json({ error: 'Key already exists' }, { status: 400 })
    const translation = await db.translation.create({ data: { key, en, ar, group: group || 'general' } })
    return NextResponse.json({ ok: true, translation })
  } catch (err) {
    console.error('POST /api/admin/translations error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { id, key, en, ar, group } = await req.json()
    const data: any = {}
    if (key !== undefined) data.key = key
    if (en !== undefined) data.en = en
    if (ar !== undefined) data.ar = ar
    if (group !== undefined) data.group = group
    const translation = await db.translation.update({ where: { id }, data })
    return NextResponse.json({ ok: true, translation })
  } catch (err) {
    console.error('PUT /api/admin/translations error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { id } = await req.json()
    await db.translation.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/translations error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')
```

---

## 6. Translation Admin Page

**File:** `src/app/admin/translations/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminTranslationsPage() {
  const [translations, setTranslations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ key: '', en: '', ar: '', group: 'general' })

  useEffect(() => {
    fetch('/api/admin/translations').then(r => r.json()).then(d => {
      if (d.ok) setTranslations(Array.isArray(d.translations) ? d.translations : [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.key || !form.en || !form.ar) return toast.error('Key, English, and Arabic required')
    const url = '/api/admin/translations'
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { ...form, id: editing } : form
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      toast.success(editing ? 'Translation updated' : 'Translation created')
      const data = await res.json()
      if (editing) {
        setTranslations(translations.map(t => t.id === editing ? data.translation : t))
      } else {
        setTranslations([data.translation, ...translations])
      }
      setShowForm(false); setEditing(null)
      setForm({ key: '', en: '', ar: '', group: 'general' })
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  function editTranslation(t: any) {
    setForm({ key: t.key, en: t.en, ar: t.ar, group: t.group || 'general' })
    setEditing(t.id)
    setShowForm(true)
  }

  async function deleteTranslation(id: string) {
    if (!confirm('Delete this translation?')) return
    const res = await fetch('/api/admin/translations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setTranslations(translations.filter(t => t.id !== id))
      toast.success('Translation deleted')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  const filtered = translations.filter(t =>
    t.key.toLowerCase().includes(search.toLowerCase()) ||
    t.en.toLowerCase().includes(search.toLowerCase()) ||
    t.ar.includes(search)
  )

  if (loading) return <div className="p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Translation Manager</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ key: '', en: '', ar: '', group: 'general' }) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Add Translation'}
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search translations..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" />
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-border p-5 mb-6 max-w-2xl space-y-3">
          <h3 className="font-semibold text-navy">{editing ? 'Edit Translation' : 'New Translation'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Key</label><input required value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1 font-mono" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Group</label><input value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">English</label><textarea required rows={2} value={form.en} onChange={e => setForm({ ...form, en: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">Arabic</label><textarea required rows={2} dir="rtl" value={form.ar} onChange={e => setForm({ ...form, ar: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-64">Key</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">English</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Arabic</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Group</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs text-navy">{t.key}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{t.en}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" dir="rtl">{t.ar}</td>
                <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-muted-foreground">{t.group}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => editTranslation(t)} className="text-gold hover:text-gold/80 text-xs font-medium">Edit</button>
                  <button onClick={() => deleteTranslation(t.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{search ? 'No matching translations.' : 'No translations yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## 7. DB-Backed Translation Loader

**File:** `src/lib/i18n/db-translations.ts`

```typescript
import { db } from '@/lib/db'
import type { Locale } from './translations'

let cached: { en: Record<string, any>; ar: Record<string, any> } | null = null
let cacheTime = 0
const CACHE_TTL = 60000

function setNested(obj: Record<string, any>, path: string[], value: string) {
  let current = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]] || typeof current[path[i]] !== 'object') {
      current[path[i]] = {}
    }
    current = current[path[i]]
  }
  current[path[path.length - 1]] = value
}

export async function loadDbTranslations(): Promise<{ en: Record<string, any>; ar: Record<string, any> }> {
  if (cached && Date.now() - cacheTime < CACHE_TTL) return cached
  try {
    const rows = await db.translation.findMany({ select: { key: true, en: true, ar: true } })
    const en: Record<string, any> = {}
    const ar: Record<string, any> = {}
    for (const row of rows) {
      const parts = row.key.split('.')
      setNested(en, parts, row.en)
      setNested(ar, parts, row.ar)
    }
    cached = { en, ar }
    cacheTime = Date.now()
    return cached
  } catch {
    return { en: {}, ar: {} }
  }
}

export function invalidateTranslationCache() {
  cached = null
  cacheTime = 0
}

export function getMergedTranslations(dbT: { en: Record<string, any>; ar: Record<string, any> }, locale: Locale, fallback: any) {
  const dbMap = locale === 'ar' ? dbT.ar : dbT.en
  return deepMerge(fallback, dbMap)
}

function deepMerge(target: any, source: any): any {
  const result = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}
```

---

## 8. Tax Rate API Routes

**File:** `src/app/api/admin/tax-rates/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  try {
    const rates = await db.taxRate.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, rates })
  } catch (err) {
    console.error('GET /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { name, rate, country, region, isActive } = await req.json()
    if (!name || rate == null) return NextResponse.json({ error: 'name and rate required' }, { status: 400 })
    const taxRate = await db.taxRate.create({
      data: { name, rate: parseFloat(rate), country: country || 'EG', region: region || null, isActive: isActive ?? true },
    })
    return NextResponse.json({ ok: true, taxRate })
  } catch (err) {
    console.error('POST /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { id, name, rate, country, region, isActive } = await req.json()
    const data: any = {}
    if (name !== undefined) data.name = name
    if (rate !== undefined) data.rate = parseFloat(rate)
    if (country !== undefined) data.country = country
    if (region !== undefined) data.region = region
    if (isActive !== undefined) data.isActive = isActive
    const taxRate = await db.taxRate.update({ where: { id }, data })
    return NextResponse.json({ ok: true, taxRate })
  } catch (err) {
    console.error('PUT /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { id } = await req.json()
    await db.taxRate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')
```

---

## 9. Tax Rate Admin Page

**File:** `src/app/admin/tax-rates/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminTaxRatesPage() {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', rate: '', country: 'EG', region: '', isActive: true })

  useEffect(() => {
    fetch('/api/admin/tax-rates').then(r => r.json()).then(d => {
      if (d.ok) setRates(Array.isArray(d.rates) ? d.rates : [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const rateNum = parseFloat(form.rate)
    if (!form.name || isNaN(rateNum) || rateNum < 0 || rateNum > 100) return toast.error('Valid name and rate (0-100) required')
    const url = '/api/admin/tax-rates'
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { ...form, id: editing, rate: rateNum } : { ...form, rate: rateNum }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      toast.success(editing ? 'Tax rate updated' : 'Tax rate created')
      const data = await res.json()
      if (editing) {
        setRates(rates.map(r => r.id === editing ? data.taxRate : r))
      } else {
        setRates([data.taxRate, ...rates])
      }
      setShowForm(false); setEditing(null)
      setForm({ name: '', rate: '', country: 'EG', region: '', isActive: true })
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  function editRate(r: any) {
    setForm({ name: r.name, rate: String(r.rate), country: r.country, region: r.region || '', isActive: r.isActive })
    setEditing(r.id)
    setShowForm(true)
  }

  async function deleteRate(id: string) {
    if (!confirm('Delete this tax rate?')) return
    const res = await fetch('/api/admin/tax-rates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setRates(rates.filter(r => r.id !== id)); toast.success('Tax rate deleted') }
    else { const err = await res.json(); toast.error(err.error || 'Failed') }
  }

  if (loading) return <div className="p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Tax Rates</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', rate: '', country: 'EG', region: '', isActive: true }) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Add Tax Rate'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-border p-5 mb-6 max-w-lg space-y-3">
          <h3 className="font-semibold text-navy">{editing ? 'Edit Tax Rate' : 'New Tax Rate'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VAT" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Rate (%)</label><input required type="number" step="0.01" min="0" max="100" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} placeholder="18" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Country</label><input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="EG" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Region (optional)</label><input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="All" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div className="flex gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rate</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Country</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Region</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                <td className="px-4 py-3 font-mono text-navy">{r.rate}%</td>
                <td className="px-4 py-3 text-muted-foreground">{r.country || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.region || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => editRate(r)} className="text-gold hover:text-gold/80 text-xs font-medium">Edit</button>
                  <button onClick={() => deleteRate(r.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {rates.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No tax rates configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## 10. Tax Auto-Apply at Checkout

**File:** `src/lib/tax.ts`

```typescript
import { db } from '@/lib/db'

export async function getApplicableTaxRate(country: string, region?: string): Promise<{ name: string; rate: number } | null> {
  try {
    let rate = await db.taxRate.findFirst({
      where: { country, region: region || null, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!rate && region) {
      rate = await db.taxRate.findFirst({
        where: { country, region: null, isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    }
    if (!rate) {
      rate = await db.taxRate.findFirst({
        where: { country: 'EG', isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    }
    return rate ? { name: rate.name, rate: rate.rate } : null
  } catch { return null }
}

export function calculateTax(subtotal: number, shipping: number, taxRate: number): number {
  return parseFloat(((subtotal + shipping) * (taxRate / 100)).toFixed(2))
}
```

**File:** `src/app/api/admin/tax-rates/apply/route.ts` — Public endpoint for checkout tax lookup:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getApplicableTaxRate, calculateTax } from '@/lib/tax'

export async function POST(req: NextRequest) {
  try {
    const { country, region, subtotal, shipping } = await req.json()
    const tax = await getApplicableTaxRate(country || 'EG', region)
    if (!tax) return NextResponse.json({ ok: true, taxAmount: 0, taxName: null, taxRate: 0 })
    const taxAmount = calculateTax(subtotal || 0, shipping || 0, tax.rate)
    return NextResponse.json({ ok: true, taxAmount, taxName: tax.name, taxRate: tax.rate })
  } catch (err) {
    console.error('POST /api/admin/tax-rates/apply error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}
```

---

## 11. Sidebar Links

**File:** `src/components/admin/Sidebar.tsx` — Add after the `newsletter` link (before `payments`):

```typescript
  { href: '/admin/currencies', label: 'Currencies', icon: CreditCard, permission: 'settings' },
  { href: '/admin/translations', label: 'Translations', icon: MessageSquareText, permission: 'settings' },
  { href: '/admin/tax-rates', label: 'Tax Rates', icon: Calculator, permission: 'settings' },
```

Add `Calculator` to the import from `lucide-react` if not already present (it is already imported). Add `CreditCard` and `MessageSquareText` if not already imported (check existing imports — `CreditCard` is imported, `MessageSquareText` is imported, `Calculator` is imported).

---

## 12. Public Currency API

**File:** `src/app/api/currencies/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const currencies = await db.currency.findMany({
      where: { isActive: true },
      select: { code: true, name: true, symbol: true, exchangeRate: true, isDefault: true },
    })
    return NextResponse.json({ ok: true, currencies })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}
```

---

## 13. Initialization — Load Currency in Root Layout

**File:** `src/app/layout.tsx` or appropriate client provider — Add a `CurrencyInit` component:

```typescript
'use client'

import { useEffect } from 'react'
import { useCurrencyStore } from '@/lib/currency-store'

export function CurrencyInit() {
  const loadCurrencies = useCurrencyStore((s) => s.loadCurrencies)
  useEffect(() => { loadCurrencies() }, [loadCurrencies])
  return null
}
```

Add `<CurrencyInit />` near the top of the layout body (after `<html>` opening, before main content).

---

## Execution Order

1. Add models to `prisma/schema.prisma` → `npx prisma migrate dev --name add-i18n`
2. Add seed currencies to `prisma/seed.ts` → `npx prisma db seed`
3. Create `src/app/api/admin/currencies/route.ts`
4. Create `src/app/admin/currencies/page.tsx`
5. Update `src/lib/format.ts` (remove static CURRENCIES)
6. Create `src/lib/currency-store.ts`
7. Create `src/app/api/admin/translations/route.ts`
8. Create `src/app/admin/translations/page.tsx`
9. Create `src/lib/i18n/db-translations.ts`
10. Create `src/app/api/admin/tax-rates/route.ts`
11. Create `src/app/admin/tax-rates/page.tsx`
12. Create `src/lib/tax.ts`
13. Create `src/app/api/admin/tax-rates/apply/route.ts`
14. Create `src/app/api/currencies/route.ts`
15. Update `src/components/admin/Sidebar.tsx`
16. Create `CurrencyInit` and add to layout
