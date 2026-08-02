'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { ActionMenu } from '@/components/admin/ActionMenu'
import type { ColumnDef } from '@tanstack/react-table'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function SegmentsPage() {
  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  useEffect(() => {
    fetch('/api/admin/customers/segments')
      .then(r => r.json())
      .then(data => setSegments(Array.isArray(data.segments) ? data.segments : []))
      .catch(() => toast.error(ta('Failed to load segments')))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm(ta('Delete this segment?'))) return
    try {
      const res = await fetch(`/api/admin/customers/segments/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error(ta('Failed to delete')); return }
      setSegments(prev => prev.filter(s => s.id !== id))
      toast.success(ta('Segment deleted'))
    } catch {
      toast.error(ta('Failed to delete'))
    }
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'name', header: ta('Name'), cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span> },
    {
      accessorKey: 'rules',
      header: ta('Rules'),
      cell: ({ row }) => {
        const rules = row.original.rules || {}
        const parts: string[] = []
        if (rules.minSpend) parts.push(ta(`Spent > $${rules.minSpend}`))
        if (rules.minOrders) parts.push(ta(`Orders > ${rules.minOrders}`))
        if (rules.registeredBefore) parts.push(ta(`Registered before ${fmtDate(rules.registeredBefore)}`))
        return <span className="text-xs text-muted-foreground">{parts.join(', ') || ta('No rules set')}</span>
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
            { label: ta('Edit'), icon: <Pencil className="h-4 w-4" />, onClick: () => window.location.href = `/admin/customers/segments/${row.original.id}` },
            { label: ta('Delete'), icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(row.original.id), variant: 'destructive' },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Customer Segments')}
        actions={
          <Link href="/admin/customers/segments/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
            <Plus className="h-4 w-4" /> {ta('Create Segment')}
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={segments}
        keyExtractor={s => s.id}
        loading={loading}
        emptyTitle={ta('No segments yet')}
        emptyDescription={ta('Create your first customer segment for targeted campaigns')}
        emptyAction={{ label: ta('Create Segment'), onClick: () => window.location.href = '/admin/customers/segments/new' }}
      />
    </div>
  )
}
