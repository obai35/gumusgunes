'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Package } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ExportButton } from '@/components/admin/ExportButton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import type { ColumnDef } from '@tanstack/react-table'

export default function InventoryPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [products, setProducts] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products?limit=200&sort=stock_asc').then(r => r.json()),
      fetch('/api/admin/inventory/logs?limit=20').then(r => r.json()),
    ])
      .then(([productData, logData]) => {
        setProducts(Array.isArray(productData.products) ? productData.products : [])
        setLogs(Array.isArray(logData.logs) ? logData.logs : Array.isArray(logData) ? logData : [])
      })
      .catch(() => toast.error(ta('Failed to load inventory')))
      .finally(() => setLoading(false))
  }, [])

  const productColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: ta('Product'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
            {row.original.imageUrl && <img src={row.original.imageUrl} alt={row.original.name} className="h-full w-full object-cover" />}
          </div>
          <span className="font-medium text-navy">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'sku',
      header: ta('SKU'),
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>,
    },
    {
      accessorKey: 'category.name',
      header: ta('Category'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.category?.name}</span>,
    },
    {
      accessorKey: 'stock',
      header: ta('Stock'),
      cell: ({ row }) => <span className="font-medium text-navy">{fmtNum(row.original.stock)}</span>,
    },
    {
      id: 'status',
      header: ta('Status'),
      cell: ({ row }) => {
        const stock = row.original.stock
        return stock === 0 ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{ta('Out of Stock')}</span>
        ) : stock < 5 ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{ta('Low Stock')}</span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{ta('In Stock')}</span>
        )
      },
    },
  ]

  const logColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'product.name',
      header: ta('Product'),
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.product?.name}</span>,
    },
    {
      accessorKey: 'type',
      header: ta('Type'),
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row.original.type === 'SALE' ? 'bg-blue-100 text-blue-700' :
          row.original.type === 'ADJUSTMENT' ? 'bg-purple-100 text-purple-700' :
          'bg-gray-100 text-gray-700'
        }`}>{row.original.type}</span>
      ),
    },
    {
      accessorKey: 'change',
      header: ta('Change'),
      cell: ({ row }) => (
        <span className={`font-medium ${row.original.change < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {row.original.change > 0 ? '+' : ''}{row.original.change}
        </span>
      ),
    },
    {
      accessorKey: 'note',
      header: ta('Note'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.note || '-'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: ta('Date'),
      cell: ({ row }) => <span className="text-muted-foreground">{fmtDate(row.original.createdAt)}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Inventory')}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              filename="inventory-export"
              columns={[
                { header: ta('Product'), key: 'name' },
                { header: ta('SKU'), key: 'sku' },
                { header: ta('Stock'), key: 'stock' },
              ]}
              data={products}
            />
            <Link
              href="/admin/inventory/adjust"
              className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
            >
              <ArrowUpDown className="h-4 w-4" /> {ta('Adjust Stock')}
            </Link>
          </div>
        }
      />

      <div className="mb-8">
        <DataTable
          columns={productColumns}
          data={products}
          keyExtractor={(p) => p.id}
          loading={loading}
          responsiveCards
          onRowClick={(p) => window.location.href = `/admin/products/${p.id}/edit`}
          emptyTitle={ta('No products in inventory')}
        />
      </div>

      <div>
        <h2 className="text-lg font-display font-semibold text-navy mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" /> {ta('Recent Inventory Activity')}
        </h2>
        <DataTable
          columns={logColumns}
          data={logs}
          keyExtractor={(l) => l.id}
          loading={loading}
          responsiveCards
          emptyTitle={ta('No recent activity')}
        />
      </div>
    </div>
  )
}
