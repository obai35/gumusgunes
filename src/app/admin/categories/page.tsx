'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { FolderTree, Plus, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  icon: string | null
  isVisible: boolean
  parentId: string | null
  parent: { id: string; name: string; slug: string } | null
  children: { id: string; name: string; slug: string; icon: string | null; imageUrl: string | null }[]
  _count: { products: number }
}

export default function CategoriesPage() {
  const { user } = useAdminAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [icon, setIcon] = useState('')
  const [parentId, setParentId] = useState('')
  const [formVisible, setFormVisible] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setName(''); setSlug(''); setDescription(''); setImageUrl(''); setIcon(''); setParentId(''); setEditId(null); setFormVisible(true)
  }

  function autoSlug(val: string) {
    if (!editId) setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleSubmit() {
    if (!name || !slug) { toast.error('Name and slug are required'); return }
    setSaving(true)
    try {
      const url = editId ? `/api/admin/categories/${editId}` : '/api/admin/categories'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description, imageUrl, icon, parentId: parentId || null, isVisible: formVisible }),
      })
      if (res.ok) {
        toast.success(editId ? 'Category updated' : 'Category created')
        resetForm(); setShowModal(false)
        const updated = await fetch('/api/admin/categories').then(r => r.json())
        setCategories(updated)
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed')
      }
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Category deleted')
        setCategories(prev => prev.filter(c => c.id !== id))
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
  }

  function openEdit(cat: Category) {
    setName(cat.name); setSlug(cat.slug); setDescription(cat.description || '')
    setImageUrl(cat.imageUrl || ''); setIcon(cat.icon || ''); setParentId(cat.parentId || '')
    setFormVisible(cat.isVisible); setEditId(cat.id); setShowModal(true)
  }

  const parents = categories.filter(c => !c.parentId)

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Categories</h1>

      <div className="flex justify-end mb-4">
        <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Parent</th>
              <th className="p-3 font-medium">Products</th>
              <th className="p-3 font-medium">Visible</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parents.map(parent => (
              <>
                <tr key={parent.id} className="border-b border-border/50 bg-navy/5">
                  <td className="p-3 font-semibold text-navy">{parent.icon && <span className="mr-2">{parent.icon}</span>}{parent.name}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{parent.slug}</td>
                  <td className="p-3 text-muted-foreground">—</td>
                  <td className="p-3">{parent._count.products}</td>
                  <td className="p-3">
                    <button onClick={async () => {
                      const res = await fetch(`/api/admin/categories/${parent.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isVisible: !parent.isVisible }),
                      })
                      if (res.ok) {
                        setCategories(prev => prev.map(c => c.id === parent.id ? { ...c, isVisible: !c.isVisible } : c))
                      } else toast.error('Failed to toggle visibility')
                    }} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${parent.isVisible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {parent.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {parent.isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(parent)} className="text-navy hover:text-gold"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(parent.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
                {categories.filter(c => c.parentId === parent.id).map(child => (
                  <tr key={child.id} className="border-b border-border/50">
                    <td className="p-3 pl-8 text-navy">
                      {child.icon && <span className="mr-2">{child.icon}</span>}
                      {child.name}
                    </td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{child.slug}</td>
                    <td className="p-3 text-muted-foreground">{parent.name}</td>
                    <td className="p-3">{child._count.products}</td>
                    <td className="p-3">
                      <button onClick={async () => {
                        const res = await fetch(`/api/admin/categories/${child.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isVisible: !child.isVisible }),
                        })
                        if (res.ok) {
                          setCategories(prev => prev.map(c => c.id === child.id ? { ...c, isVisible: !c.isVisible } : c))
                        } else toast.error('Failed to toggle visibility')
                      }} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${child.isVisible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {child.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {child.isVisible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(child)} className="text-navy hover:text-gold"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(child.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ))}
            {!loading && categories.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No categories yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy">{editId ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setShowModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={e => { setName(e.target.value); autoSlug(e.target.value) }} placeholder="Name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="Icon (emoji)" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="">Top-level category</option>
                {parents.filter(p => p.id !== editId).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={formVisible} onChange={e => setFormVisible(e.target.checked)} className="rounded" />
                Visible on storefront
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
