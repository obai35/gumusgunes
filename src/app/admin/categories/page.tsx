'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ExportButton } from '@/components/admin/ExportButton'
import type { ColumnDef } from '@tanstack/react-table'

type Category = {
  id: string; name: string; slug: string; description: string | null
  imageUrl: string | null; icon: string | null; isVisible: boolean
  parentId: string | null
  parent: { id: string; name: string; slug: string } | null
  children: { id: string; name: string; slug: string; icon: string | null; imageUrl: string | null }[]
  _count: { products: number }
}

export default function CategoriesPage() {
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
      .then(data => setCategories(Array.isArray(data) ? data : []))
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
        setCategories(Array.isArray(updated) ? updated : [])
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

  async function toggleVisibility(cat: Category) {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !cat.isVisible }),
    })
    if (res.ok) {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isVisible: !c.isVisible } : c))
    } else toast.error('Failed to toggle visibility')
  }

  function openEdit(cat: Category) {
    setName(cat.name); setSlug(cat.slug); setDescription(cat.description || '')
    setImageUrl(cat.imageUrl || ''); setIcon(cat.icon || ''); setParentId(cat.parentId || '')
    setFormVisible(cat.isVisible); setEditId(cat.id); setShowModal(true)
  }

  const parents = categories.filter(c => !c.parentId)

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-semibold text-navy">
          {row.original.icon && <span className="mr-2">{row.original.icon}</span>}
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.slug}</span>,
    },
    {
      accessorKey: 'parent',
      header: 'Parent',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.parent?.name || '—'}</span>,
    },
    {
      accessorKey: '_count.products',
      header: 'Products',
    },
    {
      accessorKey: 'isVisible',
      header: 'Visible',
      cell: ({ row }) => (
        <button
          onClick={() => toggleVisibility(row.original)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${row.original.isVisible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {row.original.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {row.original.isVisible ? 'Visible' : 'Hidden'}
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row.original)} className="text-navy hover:text-gold"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Categories"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              filename="categories-export"
              columns={[
                { header: 'Name', key: 'name' },
                { header: 'Slug', key: 'slug' },
                { header: 'Products', key: '_count.products' },
                { header: 'Visible', key: 'isVisible' },
              ]}
              data={categories}
            />
            <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
              <Plus className="h-4 w-4" /> New Category
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={categories}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyTitle="No categories yet"
        emptyDescription="Create your first category to organize products"
        emptyAction={{ label: 'New Category', onClick: () => { resetForm(); setShowModal(true) } }}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
