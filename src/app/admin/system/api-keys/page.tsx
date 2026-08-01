'use client'

import { useState, useEffect } from 'react'
import { Plus, Key, Copy, Check, Eye, EyeOff, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'

type ApiKey = {
  id: string
  name: string
  key: string
  permissions: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export default function AdminApiKeys() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ApiKey | null>(null)
  const [form, setForm] = useState({ name: '', permissions: '' })
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchKeys() }, [])

  async function fetchKeys() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system/api-keys')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setKeys(data.keys || [])
    } catch {
      toast.error(ta('Failed to load API keys'))
    } finally {
      setLoading(false)
    }
  }

  async function saveKey() {
    if (!form.name) { toast.error(ta('Name is required')); return }
    try {
      const res = await fetch('/api/admin/system/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, permissions: form.permissions ? form.permissions.split(',').map(s => s.trim()) : [] }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || ta('Failed')) }
      const data = await res.json()
      setNewKeyRaw(data.apiKey.rawKey)
      setForm({ name: '', permissions: '' })
      fetchKeys()
    } catch (err: any) {
      toast.error(err.message || ta('Failed to create key'))
    }
  }

  async function toggleKey(apiKey: ApiKey) {
    try {
      const res = await fetch(`/api/admin/system/api-keys/${apiKey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !apiKey.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(ta(`Key ${apiKey.isActive ? 'deactivated' : 'activated'}`))
      fetchKeys()
    } catch { toast.error(ta('Failed to toggle key')) }
  }

  async function deleteKey(apiKey: ApiKey) {
    if (!confirm(ta(`Delete API key "${apiKey.name}"? This cannot be undone.`))) return
    try {
      await fetch(`/api/admin/system/api-keys/${apiKey.id}`, { method: 'DELETE' })
      toast.success(ta('API key deleted'))
      fetchKeys()
    } catch { toast.error(ta('Failed to delete')) }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const columns: ColumnDef<ApiKey>[] = [
    {
      accessorKey: 'name',
      header: ta('Name'),
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span>,
    },
    {
      accessorKey: 'key',
      header: ta('Key'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">{row.original.key}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: ta('Status'),
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${row.original.isActive ? 'text-green-600' : 'text-gray-400'}`}>
          {row.original.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
          {row.original.isActive ? ta('Active') : ta('Inactive')}
        </span>
      ),
    },
    {
      accessorKey: 'lastUsedAt',
      header: ta('Last Used'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lastUsedAt ? fmtDateTime(row.original.lastUsedAt) : ta('Never')}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ta('Created'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{fmtDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => toggleKey(row.original)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors" title={row.original.isActive ? ta('Deactivate') : ta('Activate')}>
            {row.original.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          </button>
          <button onClick={() => deleteKey(row.original)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title={ta('Delete')}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('API Keys')}
        subtitle={ta('Manage API keys for programmatic access')}
        actions={
          <button
            onClick={() => { setShowModal(true); setNewKeyRaw(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> {ta('Generate Key')}
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={keys}
        keyExtractor={(k) => k.id}
        loading={loading}
        emptyTitle={ta('No API keys')}
        emptyDescription={ta('Generate your first API key for programmatic access')}
        emptyAction={{ label: ta('Generate Key'), onClick: () => { setShowModal(true); setNewKeyRaw(null) } }}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            {newKeyRaw ? (
              <div>
                <h2 className="text-lg font-semibold text-navy mb-2">{ta('API Key Generated')}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {ta("Copy this key now. You won't be able to see it again.")}
                </p>
                <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-lg p-3 mb-4">
                  <code className="flex-1 text-sm font-mono break-all">{newKeyRaw}</code>
                  <button
                    onClick={() => copyToClipboard(newKeyRaw)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
                <button
                  onClick={() => { setShowModal(false); setNewKeyRaw(null) }}
                  className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90"
                >
                  {ta('Done')}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-navy mb-4">{ta('Generate API Key')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Name')}</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                      placeholder={ta('e.g. Production Integration')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {ta('Permissions (comma-separated, optional)')}
                    </label>
                    <input
                      type="text"
                      value={form.permissions}
                      onChange={e => setForm(f => ({ ...f, permissions: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                      placeholder={ta('e.g. orders:read, products:write')}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">{ta('Cancel')}</button>
                  <button onClick={saveKey} disabled={!form.name}
                    className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
                  >{ta('Generate')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
