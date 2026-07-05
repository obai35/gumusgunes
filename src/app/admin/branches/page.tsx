'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, Eye, EyeOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminBranches() {
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetch('/api/admin/branches').then(r => r.json()).then(d => {
      if (d.ok) setBranches(d.branches)
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email) return toast.error('Name and email required')
    if (!editing && !form.password) return toast.error('Password required for new branches')

    const url = '/api/admin/branches'
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { ...form, id: editing } : form

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      toast.success(editing ? 'Branch updated' : 'Branch created')
      const data = await res.json()
      if (editing) {
        setBranches(branches.map(b => b.id === editing ? data.branch : b))
      } else {
        setBranches([data.branch, ...branches])
      }
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', email: '', password: '', phone: '', address: '' })
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  async function toggleActive(branch: any) {
    const res = await fetch('/api/admin/branches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: branch.id, isActive: !branch.isActive }),
    })
    if (res.ok) {
      setBranches(branches.map(b => b.id === branch.id ? { ...b, isActive: !b.isActive } : b))
      toast.success(`Branch ${branch.isActive ? 'deactivated' : 'activated'}`)
    }
  }

  function editBranch(branch: any) {
    setForm({ name: branch.name, email: branch.email, password: '', phone: branch.phone || '', address: branch.address || '' })
    setEditing(branch.id)
    setShowForm(true)
  }

  if (loading) return <div className="p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Branch Management</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', email: '', password: '', phone: '', address: '' }) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Add Branch'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-border p-5 mb-6 max-w-lg space-y-3">
          <h3 className="font-semibold text-navy">{editing ? 'Edit Branch' : 'New Branch'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Branch Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Email (login)</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {editing ? 'New Password (leave blank to keep)' : 'Password'}
            </label>
            <div className="relative mt-1">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 pr-9 rounded-lg border border-border text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{editing ? 'Update' : 'Create'} Branch</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b: any) => (
              <tr key={b.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-navy">{b.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.phone || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(b)} className={`text-xs px-2 py-1 rounded-full font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => editBranch(b)} className="text-gold hover:text-gold/80 text-xs font-medium">Edit</button>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No branches yet. Add your first branch.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
