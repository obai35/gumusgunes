'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Package, List, History, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type Stats = {
  totalProducts: number
  productsWithCost: number
  avgMargin: number
  totalStockValue: number
  activePriceLists: number
  costHistoryEntries: number
}

type CostEntry = {
  id: string
  product: { id: string; name: string; sku: string }
  unitCost: number
  quantity: number
  totalCost: number
  type: string
  reference: string | null
  createdAt: string
}

export default function PricingPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<CostEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/pricing/overview')
      .then((r) => r.json())
      .then((d) => { setStats(d.stats); setRecent(d.recentCostHistory) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-muted-foreground">{ta('Loading...')}</div>

  const cards = [
    { label: ta('Active Price Lists'), value: fmtNum(stats?.activePriceLists ?? 0), icon: List, href: '/admin/pricing/lists' },
    { label: ta('Products with Costs'), value: fmtNum(stats?.productsWithCost ?? 0), icon: Package, href: '/admin/pricing/lists' },
    { label: ta('Avg Margin'), value: `${(stats?.avgMargin ?? 0).toFixed(1)}%`, icon: TrendingUp, color: 'text-green-500' },
    { label: ta('Stock Value (Cost)'), value: fmtNum(stats?.totalStockValue ?? 0), icon: DollarSign, href: '/admin/pricing/lists' },
    { label: ta('Cost History Entries'), value: fmtNum(stats?.costHistoryEntries ?? 0), icon: History, href: '/admin/pricing/lists' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{ta('Pricing & Costing')}</h1>
        <Link href="/admin/pricing/lists" className="flex items-center gap-1 text-sm text-primary hover:underline">
          <Plus className="h-4 w-4" /> {ta('Manage Price Lists')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
          >
            <div className="flex items-center justify-between">
              <card.icon className="h-5 w-5 text-muted-foreground" />
              {card.href && (
                <Link href={card.href} className="text-muted-foreground hover:text-primary">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <p className={`mt-3 text-2xl font-bold ${card.color || ''}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 font-semibold flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2"><History className="h-4 w-4" /> {ta('Recent Cost History')}</span>
          <Link href="/admin/pricing/cost-history" className="text-xs font-normal text-primary hover:underline">{ta('View All')}</Link>
        </div>
        <div className="divide-y">
          {recent.map((e) => (
            <div key={e.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{e.product.name}</span>
                <span className="text-muted-foreground ml-2">({e.product.sku})</span>
                <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-xs ${
                  e.type === 'purchase' ? 'bg-blue-100 text-blue-700' :
                  e.type === 'manufactured' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{e.type}</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{fmtCurrency(e.unitCost)} / {ta('unit')}</p>
                <p className="text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</p>
              </div>
            </div>
          ))}
          {recent.length === 0 && <p className="px-4 py-6 text-center text-muted-foreground text-sm">{ta('No cost history yet')}</p>}
        </div>
      </div>
    </div>
  )
}
