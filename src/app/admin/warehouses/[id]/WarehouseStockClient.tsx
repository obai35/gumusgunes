'use client'

import { useState, useEffect } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export function WarehouseStockClient({ warehouse }: { warehouse: any }) {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [stockLevels, setStockLevels] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    fetch(`/api/admin/warehouses/${warehouse.id}/stock${params}`)
      .then(r => r.json()).then(d => setStockLevels(d.stockLevels || [])).catch(() => {})
  }, [warehouse.id, search])

  return (
    <div>
      <Link href="/admin/warehouses" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy mb-4"><ArrowLeft className="h-4 w-4" /> {ta('Back')}</Link>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">{warehouse.name} {ta('Stock')}</h1>
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ta('Search products...')} className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            <th className="p-3 font-medium">{ta('Product')}</th><th className="p-3 font-medium">{ta('SKU')}</th>
            <th className="p-3 font-medium text-right">{ta('Warehouse Stock')}</th><th className="p-3 font-medium text-right">{ta('Main Stock')}</th>
          </tr></thead>
          <tbody>
            {stockLevels.map(sl => (
              <tr key={sl.id} className="border-b border-border/50">
                <td className="p-3 font-medium text-navy flex items-center gap-2">
                  {sl.imageUrl && <img src={sl.imageUrl} className="h-8 w-8 rounded object-cover" />}
                  {sl.productName}
                </td>
                <td className="p-3 text-muted-foreground font-mono text-xs">{sl.sku}</td>
                <td className="p-3 text-right font-medium text-navy">{fmtNum(sl.quantity)}</td>
                <td className="p-3 text-right text-muted-foreground">{fmtNum(sl.mainStock)}</td>
              </tr>
            ))}
            {stockLevels.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">{ta('No stock records')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
