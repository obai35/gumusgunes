'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Headset } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { SearchInput } from '@/components/admin/SearchInput'
import { ExportButton } from '@/components/admin/ExportButton'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'

type Agent = { id: string; email: string; name: string; phone: string | null; role: string; roleId: string | null; createdAt: string }

export default function CustomerServicePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string; permissions: string[] }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  function resetForm() { setName(''); setEmail(''); setPhone(''); setPassword(''); setRoleId(''); setEditId(null) }

  useEffect(() => {
    fetch('/api/admin/admins').then((r) => r.json()).then((data) => setAgents(Array.isArray(data) ? data : [])).catch(() => {})
    fetch('/api/admin/roles').then((r) => r.json()).then((data) => setRoles(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [search])

  async function handleSubmit() {
    if (!name || !email || !roleId) { toast.error('Name, email, and role are required'); return }
    if (!editId && !password) { toast.error('Password is required for new agent'); return }
    setLoading(true)
    try {
      const url = editId ? `/api/admin/admins/${editId}` : '/api/admin/admins'
      const method = editId ? 'PUT' : 'POST'
      const body: any = { name, email, phone: editId ? (phone || null) : (phone || undefined), roleId }
      if (password) body.password = password
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(editId ? 'Agent updated' : 'Agent created')
        resetForm(); setShowModal(false)
        const updated = await fetch('/api/admin/admins').then((r) => r.json())
        setAgents(Array.isArray(updated) ? updated : [])
      } else {
        const e = await res.json()
        const msg = e.details ? `${e.error}: ${Object.values(e.details).flat().join(', ')}` : e.error
        toast.error(msg)
      }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    setConfirmDeleteId(id)
    setConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!confirmDeleteId) return
    try {
      const res = await fetch(`/api/admin/admins/${confirmDeleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Agent deleted'); setAgents(agents.filter((a) => a.id !== confirmDeleteId)) }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed to delete') }
    finally { setConfirmOpen(false); setConfirmDeleteId(null) }
  }

  function openEdit(agent: Agent) {
    setName(agent.name); setEmail(agent.email); setPhone(agent.phone || ''); setRoleId(agent.roleId || ''); setPassword(''); setEditId(agent.id); setShowModal(true)
  }

  const filtered = useMemo(() =>
    agents.filter(
      (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
    ), [agents, search]
  )

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const totalPages = Math.ceil(filtered.length / pageSize)

  const columns: ColumnDef<Agent>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium text-navy flex items-center gap-2">
          <Headset className="h-4 w-4 text-gold" />
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.phone || '—'}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 bg-navy/5 text-navy rounded text-xs font-medium">{row.original.role}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row.original)} className="text-navy hover:text-gold transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customer Service"
        subtitle="Manage customer service agents"
        actions={
          <>
            <ExportButton
              filename="customer-service-agents"
              columns={[
                { header: 'Name', key: 'name' },
                { header: 'Email', key: 'email' },
                { header: 'Phone', key: 'phone' },
                { header: 'Role', key: 'role' },
                { header: 'Created', key: 'createdAt' },
              ]}
              data={agents}
            />
            <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
              <Plus className="h-4 w-4" /> New Agent
            </button>
          </>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(a) => a.id}
        emptyTitle="No agents found"
        emptyDescription={search ? 'Try adjusting your search terms' : undefined}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
      />

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy">{editId ? 'Edit Agent' : 'New Agent'}</h3>
                <button onClick={() => setShowModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editId ? 'New password (leave blank)' : 'Password'} type="password" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Select role...</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
                <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{loading ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Agent"
        description="Are you sure you want to delete this agent? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        destructive
      />
    </div>
  )
}
