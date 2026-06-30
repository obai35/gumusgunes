'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { ALL_PERMISSIONS } from '@/lib/permissions'
import { Shield, Users, Plus, Pencil, Trash2, X } from 'lucide-react'

type Tab = 'admins' | 'roles'

type AdminUser = { id: string; email: string; name: string; role: string; roleId: string | null; createdAt: string }
type Role = { id: string; name: string; permissions: string[]; createdAt: string }

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', accounting: 'Accounting', orders: 'Orders', receipts: 'Receipts',
  products: 'Products', inventory: 'Inventory', discounts: 'Discounts', stock_transfers: 'Stock Transfers',
  branches: 'Branches', pos: 'POS', editor: 'Site Editor', categories: 'Categories', settings: 'Settings',
  security: 'Security', admins: 'Admins',
}

export default function AdminsPage() {
  const { user } = useAdminAuth()
  const [tab, setTab] = useState<Tab>('admins')

  const isFullAccess = user?.role === 'superadmin' || user?.role === 'admin'
  if (!isFullAccess && !user?.permissions?.includes('admins')) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to access this page.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Admin Management</h1>
      <div className="flex gap-1 mb-6 border-b border-border">
        {([{ id: 'admins' as Tab, label: 'Admins', icon: Users }, { id: 'roles' as Tab, label: 'Roles', icon: Shield }]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'
            }`}
          ><t.icon className="h-4 w-4" /> {t.label}</button>
        ))}
      </div>
      {tab === 'admins' && <AdminsTab />}
      {tab === 'roles' && <RolesTab />}
    </div>
  )
}

function AdminsTab() {
  const token = useAdminAuth((s) => s.token)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [loading, setLoading] = useState(false)

  function resetForm() { setName(''); setEmail(''); setPassword(''); setRoleId(''); setEditId(null) }

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setAdmins).catch(() => {})
    fetch('/api/admin/roles', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setRoles).catch(() => {})
  }, [token])

  async function handleSubmit() {
    if (!name || !email || !roleId) { toast.error('Name, email, and role are required'); return }
    if (!editId && !password) { toast.error('Password is required for new admin'); return }
    setLoading(true)
    try {
      const url = editId ? `/api/admin/admins/${editId}` : '/api/admin/admins'
      const method = editId ? 'PUT' : 'POST'
      const body: any = { name, email, roleId }
      if (password) body.password = password
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(editId ? 'Admin updated' : 'Admin created')
        resetForm(); setShowModal(false)
        const updated = await fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
        setAdmins(updated)
      } else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this admin?')) return
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { toast.success('Admin deleted'); setAdmins(admins.filter((a) => a.id !== id)) }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed to delete') }
  }

  function openEdit(admin: AdminUser) {
    setName(admin.name); setEmail(admin.email); setRoleId(admin.roleId || ''); setPassword(''); setEditId(admin.id); setShowModal(true)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
          <Plus className="h-4 w-4" /> New Admin
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            <th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Email</th>
            <th className="p-3 font-medium">Role</th><th className="p-3 font-medium">Created</th><th className="p-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b border-border/50">
                <td className="p-3 font-medium text-navy">{a.name}</td>
                <td className="p-3 text-muted-foreground">{a.email}</td>
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
            {admins.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No admins yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy">{editId ? 'Edit Admin' : 'New Admin'}</h3>
              <button onClick={() => setShowModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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
          </div>
        </div>
      )}
    </div>
  )
}

function RolesTab() {
  const token = useAdminAuth((s) => s.token)
  const [roles, setRoles] = useState<Role[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function resetForm() { setName(''); setPermissions([]); setEditId(null) }

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/roles', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setRoles).catch(() => {})
  }, [token])

  function togglePerm(p: string) {
    setPermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  async function handleSubmit() {
    if (!name) { toast.error('Role name required'); return }
    if (permissions.length === 0) { toast.error('Select at least one permission'); return }
    setLoading(true)
    try {
      const url = editId ? `/api/admin/roles/${editId}` : '/api/admin/roles'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, permissions }) })
      if (res.ok) {
        toast.success(editId ? 'Role updated' : 'Role created')
        resetForm(); setShowModal(false)
        const updated = await fetch('/api/admin/roles', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
        setRoles(updated)
      } else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this role? Admins assigned to it will lose their permissions.')) return
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { toast.success('Role deleted'); setRoles(roles.filter((r) => r.id !== id)) }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed to delete') }
  }

  function openEdit(role: Role) {
    setName(role.name); setPermissions(role.permissions); setEditId(role.id); setShowModal(true)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
          <Plus className="h-4 w-4" /> New Role
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            <th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Permissions</th><th className="p-3 font-medium">Created</th><th className="p-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="p-3 font-medium text-navy">{r.name}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((p) => (
                      <span key={p} className="px-2 py-0.5 bg-navy/5 text-navy rounded text-xs">{PERMISSION_LABELS[p] || p}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-navy hover:text-gold transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No roles yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy">{editId ? 'Edit Role' : 'New Role'}</h3>
              <button onClick={() => setShowModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Permissions</p>
                <div className="grid grid-cols-2 gap-2">
                  {[...ALL_PERMISSIONS].map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePerm(p)} className="rounded border-border" />
                      <span className="text-sm text-navy">{PERMISSION_LABELS[p]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{loading ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
