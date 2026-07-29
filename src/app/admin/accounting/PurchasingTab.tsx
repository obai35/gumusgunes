'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Building2, Receipt, Package, DollarSign, CreditCard, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { formatCurrency } from './format'

type SubTab = 'ap-aging' | 'bill-journal' | 'inventory-valuation'

export default function PurchasingTab() {
  const [subTab, setSubTab] = useState<SubTab>('ap-aging')

  const tabs: { key: SubTab; label: string; icon: any }[] = [
    { key: 'ap-aging', label: 'AP Aging', icon: Building2 },
    { key: 'bill-journal', label: 'Bill Journal', icon: Receipt },
    { key: 'inventory-valuation', label: 'Inventory Valuation', icon: Package },
  ]

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-4">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                subTab === t.key ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          )
        })}
      </div>
      {subTab === 'ap-aging' && <APAgingView />}
      {subTab === 'bill-journal' && <BillJournalView />}
      {subTab === 'inventory-valuation' && <InventoryValuationView />}
    </div>
  )
}

function APAgingView() {
  const [aging, setAging] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/accounting/purchasing/ap-aging')
      .then(r => r.json())
      .then(d => setAging(d.aging))
      .catch(() => toast.error('Failed to load AP aging'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!aging) return <p className="text-sm text-muted-foreground py-4">No data</p>

  const bucketLabels: Record<string, string> = {
    current: 'Current (Not Due)',
    '1-30': '1–30 Days Overdue',
    '31-60': '31–60 Days Overdue',
    '61-90': '61–90 Days Overdue',
    '90+': '90+ Days Overdue',
  }
  const grandTotal = Object.values(aging).reduce((s: number, b: any) => s + b.total, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(aging).map(([key, bucket]: [string, any]) => (
          <div key={key} className="p-4 bg-white rounded-xl border border-border">
            <p className="text-xs text-muted-foreground mb-1">{bucketLabels[key]}</p>
            <p className="text-lg font-bold text-navy">{formatCurrency(bucket.total)}</p>
            <p className="text-xs text-muted-foreground">{bucket.count} bills</p>
          </div>
        ))}
      </div>
      <div className="p-4 bg-navy text-white rounded-xl flex justify-between items-center">
        <p className="font-medium">Total Accounts Payable</p>
        <p className="text-xl font-bold">{formatCurrency(grandTotal)}</p>
      </div>

      {Object.entries(aging).map(([key, bucket]: [string, any]) => bucket.bills.length > 0 && (
        <div key={key} className="bg-white rounded-xl border border-border overflow-hidden">
          <button onClick={() => setExpandedBucket(expandedBucket === key ? null : key)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-gray-50"
          >
            <span>{bucketLabels[key]} ({bucket.count})</span>
            {expandedBucket === key ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expandedBucket === key && (
            <div className="border-t border-border divide-y divide-border">
              {bucket.bills.map((bill: any) => (
                <div key={bill.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{bill.supplier?.name || 'Unknown Supplier'}</p>
                    <p className="text-xs text-muted-foreground">
                      #{bill.billNumber || bill.id.slice(0, 8)} · Due {new Date(bill.dueAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(bill.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function BillJournalView() {
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState<string | null>(null)

  const loadBills = () => {
    setLoading(true)
    fetch('/api/admin/accounting/bills?status=pending')
      .then(r => r.json())
      .then(d => setBills(d.bills || []))
      .catch(() => toast.error('Failed to load bills'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBills() }, [])

  const postJournal = async (billId: string) => {
    setPosting(billId)
    try {
      const r = await fetch('/api/admin/accounting/purchasing/bill-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Journal entry created')
      loadBills()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setPosting(null)
    }
  }

  const payBill = async (billId: string) => {
    setPosting(billId)
    try {
      const r = await fetch('/api/admin/accounting/purchasing/bill-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, paymentMethod: 'cash' }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Bill paid and journal entry created')
      loadBills()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setPosting(null)
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-3">
      {bills.length === 0 && <p className="text-sm text-muted-foreground py-4">No pending bills</p>}
      {bills.map(bill => (
        <div key={bill.id} className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">{bill.supplier?.name || bill.supplierName || 'Supplier'}</p>
              <p className="text-xs text-muted-foreground">
                #{bill.billNumber || bill.id.slice(0, 8)} · Due {new Date(bill.dueAt).toLocaleDateString()}
              </p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(bill.total)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => postJournal(bill.id)} disabled={posting === bill.id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy/90 disabled:opacity-50"
            >
              {posting === bill.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
              Post Journal Entry
            </button>
            <button onClick={() => payBill(bill.id)} disabled={posting === bill.id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <DollarSign className="h-3 w-3" /> Record Payment
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function InventoryValuationView() {
  const [valuation, setValuation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/accounting/purchasing/inventory-valuation')
      .then(r => r.json())
      .then(d => setValuation(d.valuation))
      .catch(() => toast.error('Failed to load inventory valuation'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!valuation) return <p className="text-sm text-muted-foreground py-4">No data</p>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-border">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(valuation.totalCost)}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-border">
          <p className="text-xs text-muted-foreground">Total Retail Value</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(valuation.totalRetail)}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-border">
          <p className="text-xs text-muted-foreground">Gross Margin</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(valuation.totalRetail - valuation.totalCost)}</p>
          <p className="text-xs text-muted-foreground">{valuation.totalUnits} units across {valuation.itemCount} products</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-medium text-sm">Inventory Detail</div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {valuation.items.map((p: any) => (
            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.sku || 'No SKU'} · {p.stock} units</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency((p.costPrice ?? 0) * p.stock)}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(p.costPrice ?? 0)}/unit</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
