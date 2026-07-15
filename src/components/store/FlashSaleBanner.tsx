'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

type Sale = { id: string; name: string; discountValue: number; discountType: string; endsAt: string }

export function FlashSaleBanner() {
  const [sale, setSale] = useState<Sale | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    fetch('/api/admin/sales?page=1')
      .then(r => r.json())
      .then(d => {
        const sales: Sale[] = (d.sales || []).filter((s: any) => {
          const now = new Date()
          return s.isActive && new Date(s.startDate) <= now && new Date(s.endDate) >= now
        })
        if (sales.length > 0) {
          const active = sales[0]
          setSale(active)
          updateTimeLeft(active.endsAt)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!sale) return
    const interval = setInterval(() => updateTimeLeft(sale.endsAt), 1000)
    return () => clearInterval(interval)
  }, [sale])

  function updateTimeLeft(endsAt: string) {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) { setTimeLeft('Ended'); return }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    setTimeLeft(`${h}h ${m}m ${s}s`)
  }

  if (!sale || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4" />
            <span className="font-semibold">{sale.name}</span>
            <span className="hidden sm:inline text-white/80">
              {sale.discountType === 'PERCENTAGE' ? `${sale.discountValue}% OFF` : `$${sale.discountValue} OFF`}
            </span>
            <span className="flex items-center gap-1 text-white/80">
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/shop" className="text-xs font-medium underline underline-offset-2 hover:no-underline">Shop Now</Link>
            <button onClick={() => setDismissed(true)} className="text-white/80 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
