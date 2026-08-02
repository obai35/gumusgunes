'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Percent, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ExportButton } from '@/components/admin/ExportButton'
import type { ColumnDef } from '@tanstack/react-table'
import { DiscountToggle } from './DiscountToggle'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function AdminDiscounts() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [discounts, setDiscounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/discounts')
      .then(r => r.json())
      .then(data => setDiscounts(Array.isArray(data.discounts) ? data.discounts : Array.isArray(data) ? data : []))
      .catch(() => toast.error(ta('Failed to load discounts')))
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'code',
      header: ta('Code'),
      cell: ({ row }) => (
        <span className="font-mono font-bold text-navy bg-gray-100 px-2 py-0.5 rounded text-xs">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: ta('Type'),
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          {row.original.type === 'PERCENTAGE' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'value',
      header: ta('Value'),
      cell: ({ row }) => (
        <span className="font-medium text-navy">
          {row.original.type === 'PERCENTAGE' ? `${row.original.value}%` : `${fmtCurrency(row.original.value)}`}
        </span>
      ),
    },
    {
      accessorKey: 'appliesTo',
      header: ta('Scope'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.appliesTo === 'all' ? ta('All') : row.original.appliesTo === 'category' ? ta(`Category: ${row.original.targetValue}`) : row.original.appliesTo === 'tag' ? ta(`Tag: ${row.original.targetValue}`) : ta('All')}
          {row.original.minOrder ? ` (${ta('min')} ${fmtCurrency(row.original.minOrder)})` : ''}
        </span>
      ),
    },
    {
      accessorKey: 'usedCount',
      header: ta('Usage'),
      cell: ({ row }) => <span className="text-muted-foreground">{fmtNum(row.original.usedCount)}{row.original.maxUses ? ` / ${fmtNum(row.original.maxUses)}` : ''}</span>,
    },
    {
      accessorKey: 'expiresAt',
      header: ta('Expires'),
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.expiresAt ? fmtDate(row.original.expiresAt) : ta('Never')}</span>,
    },
    {
      accessorKey: 'isActive',
      header: ta('Active'),
      cell: ({ row }) => <DiscountToggle discountId={row.original.id} value={row.original.isActive} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Discount Codes')}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              filename="discounts-export"
              columns={[
                { header: ta('Code'), key: 'code' },
                { header: ta('Type'), key: 'type' },
                { header: ta('Value'), key: 'value' },
                { header: ta('Used'), key: 'usedCount' },
                { header: ta('Active'), key: 'isActive' },
              ]}
              data={discounts}
            />
            <Link
              href="/admin/discounts/new"
              className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> {ta('Create Discount')}
            </Link>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={discounts}
        keyExtractor={(d) => d.id}
        loading={loading}
        responsiveCards
        emptyTitle={ta('No discounts yet')}
        emptyDescription={ta('Create your first discount code')}
        emptyAction={{ label: ta('Create Discount'), onClick: () => window.location.href = '/admin/discounts/new' }}
      />
    </div>
  )
}
