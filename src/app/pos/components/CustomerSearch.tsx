'use client'

import { posFetch } from '@/lib/pos-client-fetch'
import { useState, useEffect, useRef } from 'react'
import { Search, X, User } from 'lucide-react'

type Customer = {
  id: string
  name: string
  email: string
  phone: string | null
}

type Props = {
  customer: Customer | null
  setCustomer: (c: Customer | null) => void
  customerSearch: string
  setCustomerSearch: (s: string) => void
}

export default function CustomerSearch({ customer, setCustomer, customerSearch, setCustomerSearch }: Props) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!customerSearch.trim()) { setResults([]); return }
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await posFetch(`/api/admin/pos/customers?search=${encodeURIComponent(customerSearch)}`)
        const data = await res.json()
        setResults(data.customers)
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [customerSearch])

  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Customer</p>
      {customer ? (
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
          <User className="h-3.5 w-3.5 text-gold" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-silver-soft truncate">{customer.name}</p>
            <p className="text-[11px] text-white/40 truncate">{customer.email}</p>
          </div>
          <button onClick={() => { setCustomer(null); setOpen(false) }} className="text-white/20 hover:text-red-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(!open)} className="w-full py-2 px-3 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-all text-left">
          + Select Customer
        </button>
      )}
      {open && !customer && (
        <div className="mt-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by name, email, or phone"
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold/30"
              autoFocus
            />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {loading && <p className="text-xs text-white/30 text-center py-2">Searching...</p>}
            {!loading && results.length === 0 && customerSearch && (
              <p className="text-xs text-white/30 text-center py-2">No customers found</p>
            )}
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCustomer(c); setOpen(false); setCustomerSearch(''); setResults([]) }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <p className="text-xs font-medium text-silver-soft">{c.name}</p>
                <p className="text-[11px] text-white/40">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => { setCustomer(null); setOpen(false); setCustomerSearch(''); setResults([]) }}
            className="w-full py-1.5 rounded-lg text-xs text-white/30 hover:text-white/50 transition-all border border-dashed border-white/5"
          >
            Guest Checkout
          </button>
        </div>
      )}
    </div>
  )
}
