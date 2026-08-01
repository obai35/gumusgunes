'use client'

import { useState, useEffect } from 'react'
import { Plus, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'
import { Switch } from '@/components/ui/switch'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type FeatureFlag = {
  id: string
  key: string
  name: string
  enabled: boolean
  description: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminFeatureFlags() {
  const { ta } = useAdminTranslate()
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<FeatureFlag | null>(null)
  const [form, setForm] = useState({ key: '', name: '', description: '' })

  useEffect(() => { fetchFlags() }, [])

  async function fetchFlags() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system/feature-flags')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFlags(data.flags || [])
    } catch {
      toast.error(ta('Failed to load feature flags'))
    } finally {
      setLoading(false)
    }
  }

  async function toggleFlag(flag: FeatureFlag) {
    try {
      const res = await fetch(`/api/admin/system/feature-flags/${flag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !flag.enabled }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${flag.name} ${flag.enabled ? ta('disabled') : ta('enabled')}`)
      fetchFlags()
    } catch {
      toast.error(ta('Failed to toggle flag'))
    }
  }

  async function saveFlag() {
    try {
      if (editing) {
        const res = await fetch(`/api/admin/system/feature-flags/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success(ta('Feature flag updated'))
      } else {
        const res = await fetch('/api/admin/system/feature-flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || ta('Failed to create'))
        }
        toast.success(ta('Feature flag created'))
      }
      setShowModal(false)
      setEditing(null)
      setForm({ key: '', name: '', description: '' })
      fetchFlags()
    } catch (err: any) {
      toast.error(err.message || ta('Failed to save'))
    }
  }

  async function deleteFlag(flag: FeatureFlag) {
    if (!confirm(ta(`Delete "${flag.name}"? This cannot be undone.`))) return
    try {
      const res = await fetch(`/api/admin/system/feature-flags/${flag.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(ta('Feature flag deleted'))
      fetchFlags()
    } catch {
      toast.error(ta('Failed to delete'))
    }
  }

  function openEdit(flag: FeatureFlag) {
    setEditing(flag)
    setForm({ key: flag.key, name: flag.name, description: flag.description || '' })
    setShowModal(true)
  }

  function openCreate() {
    setEditing(null)
    setForm({ key: '', name: '', description: '' })
    setShowModal(true)
  }

  const columns: ColumnDef<FeatureFlag>[] = [
    {
      accessorKey: 'key',
      header: ta('Key'),
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{row.original.key}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: ta('Name'),
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span>,
    },
    {
      accessorKey: 'description',
      header: ta('Description'),
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description || '—'}</span>,
    },
    {
      accessorKey: 'enabled',
      header: ta('Status'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch checked={row.original.enabled} onCheckedChange={() => toggleFlag(row.original)} />
          <span className={`text-xs font-medium ${row.original.enabled ? 'text-green-600' : 'text-gray-400'}`}>
            {row.original.enabled ? ta('ON') : ta('OFF')}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => deleteFlag(row.original)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Feature Flags')}
        subtitle={ta('Toggle features on/off without deployment')}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> {ta('New Flag')}
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={flags}
        keyExtractor={(f) => f.id}
        loading={loading}
        emptyTitle={ta('No feature flags')}
        emptyDescription={ta('Create your first feature flag to get started')}
        emptyAction={{ label: ta('Create Flag'), onClick: openCreate }}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-navy mb-4">{editing ? ta('Edit Flag') : ta('New Feature Flag')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Key')}</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                  placeholder={ta('e.g. new_checkout_flow')}
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                  placeholder={ta('e.g. New Checkout Flow')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Description')}</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm min-h-[80px]"
                  placeholder={ta('Optional description...')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditing(null) }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {ta('Cancel')}
              </button>
              <button
                onClick={saveFlag}
                disabled={!form.key || !form.name}
                className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors"
              >
                {editing ? ta('Update') : ta('Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
