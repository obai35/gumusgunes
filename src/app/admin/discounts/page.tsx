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

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/discounts')
      .then(r => r.json())
      .then(data => setDiscounts(Array.isArray(data.discounts) ? data.discounts : Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load discounts'))
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-navy bg-gray-100 px-2 py-0.5 rounded text-xs">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          {row.original.type === 'PERCENTAGE' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => (
        <span className="font-medium text-navy">
          {row.original.type === 'PERCENTAGE' ? `${row.original.value}%` : `$${row.original.value.toFixed(2)}`}
        </span>
      ),
    },
    {
      accessorKey: 'appliesTo',
      header: 'Scope',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.appliesTo === 'all' ? 'All' : row.original.appliesTo === 'category' ? `Category: ${row.original.targetValue}` : row.original.appliesTo === 'tag' ? `Tag: ${row.original.targetValue}` : 'All'}
          {row.original.minOrder ? ` (min $${row.original.minOrder.toFixed(2)})` : ''}
        </span>
      ),
    },
    {
      accessorKey: 'usedCount',
      header: 'Usage',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.usedCount}{row.original.maxUses ? ` / ${row.original.maxUses}` : ''}</span>,
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expires',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : 'Never'}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => <DiscountToggle discountId={row.original.id} value={row.original.isActive} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Discount Codes"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              filename="discounts-export"
              columns={[
                { header: 'Code', key: 'code' },
                { header: 'Type', key: 'type' },
                { header: 'Value', key: 'value' },
                { header: 'Used', key: 'usedCount' },
                { header: 'Active', key: 'isActive' },
              ]}
              data={discounts}
            />
            <Link
              href="/admin/discounts/new"
              className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Discount
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
        emptyTitle="No discounts yet"
        emptyDescription="Create your first discount code"
        emptyAction={{ label: 'Create Discount', onClick: () => window.location.href = '/admin/discounts/new' }}
      />
    </div>
  )
}
