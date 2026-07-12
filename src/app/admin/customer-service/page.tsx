'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Headset } from 'lucide-react'

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

  function resetForm() { setName(''); setEmail(''); setPhone(''); setPassword(''); setRoleId(''); setEditId(null) }

  useEffect(() => {
    fetch('/api/admin/admins').then((r) => r.json()).then((data) => setAgents(Array.isArray(data) ? data : [])).catch(() => {})
    fetch('/api/admin/roles').then((r) => r.json()).then((data) => setRoles(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

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
    if (!confirm('Delete this agent?')) return
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Agent deleted'); setAgents(agents.filter((a) => a.id !== id)) }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed to delete') }
  }

  function openEdit(agent: Agent) {
    setName(agent.name); setEmail(agent.email); setPhone(agent.phone || ''); setRoleId(agent.roleId || ''); setPassword(''); setEditId(agent.id); setShowModal(true)
  }

  const filtered = agents.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Customer Service</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer service agents</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
          <Plus className="h-4 w-4" /> New Agent
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            <th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Email</th>
            <th className="p-3 font-medium">Phone</th><th className="p-3 font-medium">Role</th>
            <th className="p-3 font-medium">Created</th><th className="p-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-border/50">
                <td className="p-3 font-medium text-navy flex items-center gap-2">
                  <Headset className="h-4 w-4 text-gold" />
                  {a.name}
                </td>
                <td className="p-3 text-muted-foreground">{a.email}</td>
                <td className="p-3 text-muted-foreground text-sm">{a.phone || '—'}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-navy/5 text-navy rounded text-xs font-medium">{a.role}</span></td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(a)} className="text-navy hover:text-gold transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No agents yet</td></tr>}
          </tbody>
        </table>
      </div>

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
    </div>
  )
}
