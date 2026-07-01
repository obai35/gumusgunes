import Link from 'next/link'
import { db } from '@/lib/db'
import { Plus, Percent, DollarSign } from 'lucide-react'
import { DiscountToggle } from './DiscountToggle'

export const dynamic = 'force-dynamic'

export default async function AdminDiscounts() {
  const discounts = await db.discount.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Discount Codes</h1>
        <Link
          href="/admin/discounts/new"
          className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Discount
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Value</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scope</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usage</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expires</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Active</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-navy bg-gray-100 px-2 py-0.5 rounded text-xs">{d.code}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    {d.type === 'PERCENTAGE' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                    {d.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-navy">
                  {d.type === 'PERCENTAGE' ? `${d.value}%` : `E£${d.value.toFixed(2)}`}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    {d.appliesTo === 'all' ? 'All' : d.appliesTo === 'category' ? `Category: ${d.targetValue}` : d.appliesTo === 'tag' ? `Tag: ${d.targetValue}` : 'All'}
                    {d.minOrder ? ` (min $${d.minOrder.toFixed(2)})` : ''}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {d.usedCount}{d.maxUses ? ` / ${d.maxUses}` : ''}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <DiscountToggle discountId={d.id} value={d.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
