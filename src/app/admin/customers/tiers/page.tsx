'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { ActionMenu } from '@/components/admin/ActionMenu'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import type { ColumnDef } from '@tanstack/react-table'

export default function TiersPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [tiers, setTiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/customers/tiers')
      .then(r => r.json())
      .then(data => setTiers(Array.isArray(data.tiers) ? data.tiers : []))
      .catch(() => toast.error(ta('Failed to load tiers')))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm(ta('Delete this tier? Users in this tier will be unassigned.'))) return
    try {
      const res = await fetch(`/api/admin/customers/tiers/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error(ta('Failed to delete')); return }
      setTiers(prev => prev.filter(t => t.id !== id))
      toast.success(ta('Tier deleted'))
    } catch {
      toast.error(ta('Failed to delete'))
    }
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'name', header: ta('Name'), cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span> },
    { accessorKey: 'minPoints', header: ta('Min Points'), cell: ({ row }) => <span className="font-mono">{fmtNum(row.original.minPoints)}</span> },
    {
      accessorKey: 'benefits',
      header: ta('Benefits'),
      cell: ({ row }) => {
        const b = row.original.benefits || {}
        const parts: string[] = []
        if (b.discountPercent) parts.push(ta(`${b.discountPercent}% off`))
        if (b.freeShipping) parts.push(ta('Free shipping'))
        if (b.pointsMultiplier) parts.push(ta(`${b.pointsMultiplier}x points`))
        return <span className="text-xs text-muted-foreground">{parts.join(', ') || '—'}</span>
      },
    },
    {
      accessorKey: 'isActive',
      header: ta('Active'),
      cell: ({ row }) => <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{row.original.isActive ? ta('Active') : ta('Inactive')}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionMenu
          actions={[
            { label: ta('Edit'), icon: <Pencil className="h-4 w-4" />, onClick: () => window.location.href = `/admin/customers/tiers/${row.original.id}` },
            { label: ta('Delete'), icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(row.original.id), variant: 'destructive' },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Loyalty Tiers')}
        actions={
          <Link href="/admin/customers/tiers/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
            <Plus className="h-4 w-4" /> {ta('Create Tier')}
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={tiers}
        keyExtractor={t => t.id}
        loading={loading}
        emptyTitle={ta('No tiers yet')}
        emptyDescription={ta('Create your first loyalty tier')}
        emptyAction={{ label: ta('Create Tier'), onClick: () => window.location.href = '/admin/customers/tiers/new' }}
      />
    </div>
  )
}
