'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { ALL_PERMISSIONS, type Permission } from '@/lib/admin-permissions'
import { Shield, Users, Plus, Pencil, Trash2, X, History } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type Tab = 'admins' | 'roles' | 'activity'

type AdminUser = { id: string; email: string; name: string; phone: string | null; role: string; roleId: string | null; totpEnabled: boolean; lastLoginAt: string | null; createdAt: string }
type Role = { id: string; name: string; permissions: string[]; createdAt: string }

const PERMISSION_LABELS: Record<Permission, string> = {
  dashboard: 'Dashboard', accounting: 'Accounting', orders: 'Orders', receipts: 'Receipts',
  products: 'Products', inventory: 'Inventory', discounts: 'Discounts', stock_transfers: 'Stock Transfers',
  branches: 'Branches', pos: 'POS', editor: 'Site Editor', categories: 'Categories', settings: 'Settings',
  security: 'Security', admins: 'Admins', customers: 'Customers', payments: 'Payments',
  shipping: 'Shipping', reviews: 'Reviews', newsletter: 'Newsletter', activity: 'Activity Log',
  chat: 'Admin Chat', seed: 'Seed Data',
}

export default function AdminsPage() {
  const { user } = useAdminAuth()
  const [tab, setTab] = useState<Tab>('admins')

  const isFullAccess = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'admin'
  if (!isFullAccess && !user?.permissions?.includes('admins')) { return <div className="p-8 text-center text-muted-foreground">You do not have permission to access this page.</div> }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Admin Management</h1>
      <div className="flex gap-1 mb-6 border-b border-border">
        {([{ id: 'admins' as Tab, label: 'Admins', icon: Users }, { id: 'roles' as Tab, label: 'Roles', icon: Shield }, { id: 'activity' as Tab, label: 'Activity Log', icon: History }]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'}`}><t.icon className="h-4 w-4" /> {t.label}</button>
        ))}
      </div>
      {tab === 'admins' && <AdminsTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'activity' && <ActivityTab />}
    </div>
  )
}

function AdminsTab() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [search, setSearch] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  function resetForm() { setName(''); setEmail(''); setPhone(''); setPassword(''); setRoleId(''); setEditId(null) }

  useEffect(() => {
    fetch('/api/admin/admins').then((r) => r.json()).then((data) => setAdmins(Array.isArray(data) ? data : [])).catch(() => {})
    fetch('/api/admin/roles').then((r) => r.json()).then((data) => setRoles(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!name || !email || !roleId) { toast.error('Name, email, and role are required'); return }
    if (!editId && !password) { toast.error('Password is required for new admin'); return }
    setLoading(true)
    try {
      const url = editId ? `/api/admin/admins/${editId}` : '/api/admin/admins'
      const method = editId ? 'PUT' : 'POST'
      const body: any = { name, email, phone: editId ? (phone || null) : (phone || undefined), roleId }
      if (password) body.password = password
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(editId ? 'Admin updated' : 'Admin created')
        resetForm(); setShowModal(false)
        const updated = await fetch('/api/admin/admins').then((r) => r.json())
        setAdmins(Array.isArray(updated) ? updated : [])
      } else {
        const e = await res.json()
        const msg = e.details ? `${e.error}: ${Object.values(e.details).flat().join(', ')}` : e.error
        toast.error(msg)
      }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this admin?')) return
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Admin deleted'); setAdmins(admins.filter((a) => a.id !== id)) }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed to delete') }
  }

  function openEdit(admin: AdminUser) {
    setName(admin.name); setEmail(admin.email); setPhone(admin.phone || ''); setRoleId(admin.roleId || ''); setPassword(''); setEditId(admin.id); setShowModal(true)
  }

  const filtered = admins.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
          <Plus className="h-4 w-4" /> New Admin
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
            <th className="p-3 font-medium">Role</th><th className="p-3 font-medium">2FA</th>
            <th className="p-3 font-medium">Phone</th><th className="p-3 font-medium">Last Login</th>
            <th className="p-3 font-medium">Created</th><th className="p-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {Array.isArray(filtered) && filtered.map((a) => (
              <tr key={a.id} className="border-b border-border/50">
                <td className="p-3 font-medium text-navy">{a.name}</td>
                <td className="p-3 text-muted-foreground">{a.email}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-navy/5 text-navy rounded text-xs font-medium">{a.role}</span></td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.totpEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.totpEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground text-sm">{a.phone || '—'}</td>
                <td className="p-3 text-muted-foreground text-xs">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(a)} className="text-navy hover:text-gold transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No admins yet</td></tr>}
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
                <h3 className="font-semibold text-navy">{editId ? 'Edit Admin' : 'New Admin'}</h3>
                <button onClick={() => setShowModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editId ? 'New password (leave blank)' : 'Password'} type="password" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Select role...</option>
                  {Array.isArray(roles) && roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
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

function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function resetForm() { setName(''); setPermissions([]); setEditId(null) }

  useEffect(() => {
    fetch('/api/admin/roles').then((r) => r.json()).then(setRoles).catch(() => {})
  }, [])

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
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, permissions }) })
      if (res.ok) {
        toast.success(editId ? 'Role updated' : 'Role created')
        resetForm(); setShowModal(false)
        const updated = await fetch('/api/admin/roles').then((r) => r.json())
        setRoles(Array.isArray(updated) ? updated : [])
      } else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this role? Admins assigned to it will lose their permissions.')) return
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' })
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
            {Array.isArray(roles) && roles.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="p-3 font-medium text-navy">{r.name}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(r.permissions) && r.permissions.map((p) => (
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
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg"
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ActivityTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resourceFilter, setResourceFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  function fetchLogs() {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (resourceFilter) params.set('resource', resourceFilter)
    if (actionFilter) params.set('action', actionFilter)
    fetch(`/api/admin/activity?${params}`)
      .then(r => r.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => toast.error('Failed to load activity'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [])

  useEffect(() => { fetchLogs() }, [resourceFilter, actionFilter])

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    login: 'bg-purple-100 text-purple-700',
    logout: 'bg-gray-100 text-gray-700',
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select value={resourceFilter} onChange={e => { setResourceFilter(e.target.value) }} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          <option value="">All Resources</option>
          <option value="admin">Admins</option>
          <option value="role">Roles</option>
          <option value="order">Orders</option>
          <option value="product">Products</option>
          <option value="category">Categories</option>
          <option value="discount">Discounts</option>
          <option value="branch">Branches</option>
        </select>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value) }} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>
        <button onClick={fetchLogs} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">Refresh</button>
      </div>

      {loading ? (
        <div className="space-y-3"><div className="flex gap-2"><Skeleton className="h-9 w-32" /><Skeleton className="h-9 w-32" /><Skeleton className="h-9 w-16" /></div><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border/50">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No activity recorded yet</div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium mt-0.5 shrink-0 ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                    {log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-navy">{log.adminName || 'System'}</span>
                      <span className="text-muted-foreground">{log.action}d</span>
                      <span className="font-medium text-navy capitalize">{log.resource}</span>
                      {log.resourceId && <span className="text-xs text-muted-foreground font-mono">#{log.resourceId.slice(0, 8)}</span>}
                    </div>
                    {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
