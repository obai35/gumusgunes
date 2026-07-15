'use client'

import { useState, useEffect } from 'react'
import { Plus, Webhook, ExternalLink, Play, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'
import { Switch } from '@/components/ui/switch'

type WebhookItem = {
  id: string
  name: string
  url: string
  events: string
  isActive: boolean
  lastDeliveryAt: string | null
  createdAt: string
  _count: { deliveries: number }
}

const AVAILABLE_EVENTS = [
  'order.created', 'order.updated', 'order.cancelled',
  'payment.completed', 'payment.failed',
  'product.created', 'product.updated', 'product.deleted',
  'customer.created', 'admin.audit',
]

export default function AdminWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<WebhookItem | null>(null)
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[], isActive: true, secret: '' })
  const [testing, setTesting] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [showDeliveryLogs, setShowDeliveryLogs] = useState(false)

  useEffect(() => { fetchWebhooks() }, [])

  async function fetchWebhooks() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system/webhooks')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWebhooks(data.webhooks || [])
    } catch {
      toast.error('Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDeliveries(webhookId?: string) {
    try {
      const params = webhookId ? `?webhookId=${webhookId}` : ''
      const res = await fetch(`/api/admin/system/webhooks/deliveries${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDeliveries(data.deliveries || [])
    } catch {
      toast.error('Failed to load delivery logs')
    }
  }

  async function toggleWebhook(webhook: WebhookItem) {
    try {
      const res = await fetch(`/api/admin/system/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Webhook ${webhook.isActive ? 'disabled' : 'enabled'}`)
      fetchWebhooks()
    } catch {
      toast.error('Failed to toggle webhook')
    }
  }

  async function testWebhook(webhook: WebhookItem) {
    setTesting(webhook.id)
    try {
      const res = await fetch(`/api/admin/system/webhooks/${webhook.id}/test`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Test delivered in ${data.duration}ms`)
      } else {
        toast.error(`Delivery failed: ${data.error || data.status}`)
      }
    } catch {
      toast.error('Test request failed')
    } finally {
      setTesting(null)
    }
  }

  async function saveWebhook() {
    if (!form.name || !form.url || form.events.length === 0) {
      toast.error('Name, URL, and at least one event are required')
      return
    }
    try {
      const body: any = { ...form }
      if (!body.secret) delete body.secret
      if (editing) {
        const res = await fetch(`/api/admin/system/webhooks/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast.success('Webhook updated')
      } else {
        const res = await fetch('/api/admin/system/webhooks', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create') }
        toast.success('Webhook created')
      }
      setShowModal(false); setEditing(null)
      setForm({ name: '', url: '', events: [], isActive: true, secret: '' })
      fetchWebhooks()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    }
  }

  function openEdit(wh: WebhookItem) {
    setEditing(wh)
    setForm({ name: wh.name, url: wh.url, events: JSON.parse(wh.events || '[]'), isActive: wh.isActive, secret: '' })
    setShowModal(true)
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', url: '', events: [], isActive: true, secret: '' })
    setShowModal(true)
  }

  async function deleteWebhook(wh: WebhookItem) {
    if (!confirm(`Delete webhook "${wh.name}"?`)) return
    try {
      await fetch(`/api/admin/system/webhooks/${wh.id}`, { method: 'DELETE' })
      toast.success('Webhook deleted')
      fetchWebhooks()
    } catch { toast.error('Failed to delete') }
  }

  function toggleEvent(event: string) {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }))
  }

  function handleViewDeliveries(wh: WebhookItem) {
    fetchDeliveries(wh.id)
    setShowDeliveryLogs(true)
  }

  const columns: ColumnDef<WebhookItem>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span>,
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono max-w-[200px] truncate block">
          {row.original.url}
        </span>
      ),
    },
    {
      accessorKey: 'events',
      header: 'Events',
      cell: ({ row }) => {
        const events: string[] = JSON.parse(row.original.events || '[]')
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {events.slice(0, 3).map(e => (
              <span key={e} className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{e}</span>
            ))}
            {events.length > 3 && <span className="text-xs text-gray-400">+{events.length - 3}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => (
        <Switch checked={row.original.isActive} onCheckedChange={() => toggleWebhook(row.original)} />
      ),
    },
    {
      accessorKey: '_count.deliveries',
      header: 'Deliveries',
      cell: ({ row }) => (
        <button
          onClick={() => handleViewDeliveries(row.original)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          {row.original._count.deliveries}
        </button>
      ),
    },
    {
      accessorKey: 'lastDeliveryAt',
      header: 'Last Delivery',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lastDeliveryAt ? new Date(row.original.lastDeliveryAt).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => testWebhook(row.original)}
            disabled={testing === row.original.id}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors disabled:opacity-50"
            title="Test delivery"
          >
            <Play className={`h-4 w-4 ${testing === row.original.id ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy" title="Edit">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Configure outbound webhook notifications"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-4 w-4" /> New Webhook
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={webhooks}
        keyExtractor={(w) => w.id}
        loading={loading}
        emptyTitle="No webhooks configured"
        emptyDescription="Create a webhook to receive event notifications"
        emptyAction={{ label: 'Create Webhook', onClick: openCreate }}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-navy mb-4">{editing ? 'Edit Webhook' : 'New Webhook'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. Slack Notifications" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm font-mono" placeholder="https://hooks.example.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret (optional)</label>
                <input type="text" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm font-mono" placeholder="HMAC signing secret" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {AVAILABLE_EVENTS.map(event => (
                    <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300"
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={saveWebhook}
                disabled={!form.name || !form.url || form.events.length === 0}
                className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
              >{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeliveryLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeliveryLogs(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-navy">Delivery Logs</h2>
              <button onClick={() => setShowDeliveryLogs(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliveries recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {deliveries.map((d: any) => (
                  <div key={d.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {d.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">{d.event}</span>
                        <span className="text-xs text-muted-foreground">{d.webhook?.name || d.webhookId}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</span>
                    </div>
                    {d.response && (
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-[100px]">{d.response}</pre>
                    )}
                    {d.duration && <span className="text-xs text-muted-foreground mt-1 block">{d.duration}ms</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
