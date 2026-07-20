'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Search, Eye, EyeOff } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { ExportButton } from '@/components/admin/ExportButton'
import { useDebounce } from '@/hooks/useDebounce'
import type { ColumnDef } from '@tanstack/react-table'

type Brand = {
  id: string
  name: string
  nameAr: string | null
  slug: string
  logo: string | null
  isVisible: boolean
  createdAt: string
  updatedAt: string
  _count: { products: number }
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [slug, setSlug] = useState('')
  const [logo, setLogo] = useState('')
  const [formVisible, setFormVisible] = useState(true)
  const [saving, setSaving] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const fetchBrands = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      const res = await fetch(`/api/admin/brands?${params}`)
      const data = await res.json()
      if (data.ok) {
        setBrands(Array.isArray(data.brands) ? data.brands : [])
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } else {
        toast.error(data.error || 'Failed to load brands')
      }
    } catch {
      toast.error('Failed to load brands')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, pageSize])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  function resetForm() {
    setName(''); setNameAr(''); setSlug(''); setLogo(''); setEditId(null); setFormVisible(true)
  }

  function autoSlug(val: string) {
    if (!editId) setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleSubmit() {
    if (!name || !slug) { toast.error('Name and slug are required'); return }
    setSaving(true)
    try {
      const url = editId ? `/api/admin/brands/${editId}` : '/api/admin/brands'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameAr, slug, logo, isVisible: formVisible }),
      })
      if (res.ok) {
        toast.success(editId ? 'Brand updated' : 'Brand created')
        resetForm(); setShowModal(false)
        fetchBrands()
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed')
      }
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this brand?')) return
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Brand deleted')
        fetchBrands()
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
  }

  async function toggleVisibility(brand: Brand) {
    const res = await fetch(`/api/admin/brands/${brand.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !brand.isVisible }),
    })
    if (res.ok) {
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, isVisible: !b.isVisible } : b))
    } else toast.error('Failed to toggle visibility')
  }

  function openEdit(brand: Brand) {
    setName(brand.name); setNameAr(brand.nameAr || ''); setSlug(brand.slug)
    setLogo(brand.logo || ''); setFormVisible(brand.isVisible); setEditId(brand.id); setShowModal(true)
  }

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.logo && (
            <img src={row.original.logo} alt="" className="h-8 w-8 rounded-lg object-cover bg-muted" />
          )}
          <span className="font-semibold text-navy">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.slug}</span>,
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
        title="Brands"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              filename="brands-export"
              columns={[
                { header: 'Name', key: 'name' },
                { header: 'Slug', key: 'slug' },
                { header: 'Products', key: '_count.products' },
                { header: 'Visible', key: 'isVisible' },
              ]}
              data={brands}
            />
            <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
              <Plus className="h-4 w-4" /> New Brand
            </button>
          </div>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
          placeholder="Search brands..."
          className="w-full pl-9 pr-8 py-2 rounded-lg border border-border text-sm"
        />
        {searchQuery && (
          <button type="button" onClick={() => { setSearchQuery(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={brands}
        keyExtractor={(b) => b.id}
        loading={loading}
        emptyTitle={searchQuery ? 'No brands match your search' : 'No brands yet'}
        emptyDescription={searchQuery ? 'Try adjusting your search terms' : 'Create your first brand to organize products'}
        emptyAction={searchQuery ? undefined : { label: 'New Brand', onClick: () => { resetForm(); setShowModal(true) } }}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={s => { setPageSize(s); setPage(1) }}
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
                <h3 className="font-semibold text-navy">{editId ? 'Edit Brand' : 'New Brand'}</h3>
                <button onClick={() => setShowModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <input value={name} onChange={e => { setName(e.target.value); autoSlug(e.target.value) }} placeholder="Name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="Arabic Name (optional)" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
                <input value={logo} onChange={e => setLogo(e.target.value)} placeholder="Logo URL" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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
