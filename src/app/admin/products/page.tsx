'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowRight, Search, X, CheckCheck, Check, XCircle, Tags, DollarSign, Package, Star, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { ProductToggle } from './ProductToggle'
import { Skeleton } from '@/components/ui/skeleton'

type Category = { id: string; name: string }
type Product = {
  id: string; name: string; slug: string; sku: string; price: number; stock: number
  imageUrl: string; isActive: boolean; isFeatured: boolean
  category: { id: string; name: string }
}

const PER_PAGE = 20

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<Set<string>>(new Set())

  // Modals
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [priceValue, setPriceValue] = useState({ type: 'percentage', amount: '', direction: 'increase' })
  const [stockValue, setStockValue] = useState({ type: 'set', amount: '' })
  const [categoryValue, setCategoryValue] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/products?${params}`)
      const data = await res.json()
      if (data.ok) {
        setProducts(data.products)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } else {
        toast.error(data.error || 'Failed to load products')
      }
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetch('/api/admin/products/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, page])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === products.length && products.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map(p => p.id)))
    }
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function doBulk(action: string, value?: any) {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    setBusy(new Set([...busy, ...ids]))
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productIds: ids, value }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(`${action === 'toggleActive' ? (value !== false ? 'Activated' : 'Deactivated') : action === 'setFeatured' ? (value ? 'Set featured' : 'Unset featured') : action === 'setCategory' ? 'Category updated' : action === 'adjustPrice' ? 'Price adjusted' : 'Stock adjusted'} ${data.count} product(s)`)
        clearSelection()
        setCategoryValue('')
        setPriceValue({ type: 'percentage', amount: '', direction: 'increase' })
        setStockValue({ type: 'set', amount: '' })
        setShowPriceModal(false)
        setShowStockModal(false)
        fetchProducts()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch {
      toast.error('Operation failed')
    } finally {
      setBusy(new Set())
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
  }

  const selectedCount = selectedIds.size

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
          placeholder="Search by name or SKU..."
          className="w-full pl-9 pr-8 py-2 rounded-lg border border-border text-sm"
        />
        {searchQuery && (
          <button type="button" onClick={() => { setSearchQuery(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Bulk Action Toolbar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-navy/5 rounded-xl border border-border flex-wrap">
          <span className="text-sm font-medium text-navy mr-2">{selectedCount} selected</span>
          <div className="h-5 w-px bg-border mx-1" />
          <button onClick={() => doBulk('toggleActive', true)} disabled={busy.size > 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 disabled:opacity-50">
            <Check className="h-3.5 w-3.5" /> Set Active
          </button>
          <button onClick={() => doBulk('toggleActive', false)} disabled={busy.size > 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50">
            <XCircle className="h-3.5 w-3.5" /> Set Inactive
          </button>
          <div className="h-5 w-px bg-border mx-1" />
          <div className="flex items-center gap-1">
            <select
              value={categoryValue}
              onChange={e => setCategoryValue(e.target.value)}
              className="px-2 py-1.5 border border-border rounded-lg text-xs"
            >
              <option value="">Set Category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {categoryValue && (
              <button onClick={() => doBulk('setCategory', categoryValue)} disabled={busy.size > 0} className="px-2 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 disabled:opacity-50">
                <Tags className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="h-5 w-px bg-border mx-1" />
          <button onClick={() => setShowPriceModal(true)} disabled={busy.size > 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 disabled:opacity-50">
            <DollarSign className="h-3.5 w-3.5" /> Adjust Price
          </button>
          <button onClick={() => setShowStockModal(true)} disabled={busy.size > 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50">
            <Package className="h-3.5 w-3.5" /> Adjust Stock
          </button>
          <div className="h-5 w-px bg-border mx-1" />
          <button onClick={() => doBulk('setFeatured', true)} disabled={busy.size > 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200 disabled:opacity-50">
            <Star className="h-3.5 w-3.5" /> Set Featured
          </button>
          <button onClick={() => doBulk('setFeatured', false)} disabled={busy.size > 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50">
            <Star className="h-3.5 w-3.5" /> Unset Featured
          </button>
          <div className="h-5 w-px bg-border mx-1" />
          <button onClick={clearSelection} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground rounded-lg text-xs font-medium hover:text-navy">
            <RotateCcw className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedIds.size === products.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Featured</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Active</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">{searchQuery ? 'No products match your search.' : 'No products yet.'}</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className={`border-b border-border/50 hover:bg-gray-50/50 ${selectedIds.has(p.id) ? 'bg-navy/[0.02]' : ''}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    <span className="font-medium text-navy">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.category.name}</td>
                <td className="px-4 py-3 font-medium text-navy">${p.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.isFeatured ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                      <Star className="h-3 w-3" /> Featured
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3"><ProductToggle productId={p.id} field="isActive" value={p.isActive} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium">
                    Edit <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} ({total} products)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span key={`e-${p}`} className="px-1 text-muted-foreground">...</span>}
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${p === page ? 'bg-navy text-silver' : 'border border-border hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                </>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Price Modal */}
      <AnimatePresence>
        {showPriceModal && (
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
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy">Adjust Price</h3>
                <button onClick={() => setShowPriceModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriceValue(p => ({ ...p, type: 'percentage' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${priceValue.type === 'percentage' ? 'bg-navy text-silver border-navy' : 'border-border hover:bg-gray-50'}`}
                  >Percentage</button>
                  <button
                    onClick={() => setPriceValue(p => ({ ...p, type: 'fixed' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${priceValue.type === 'fixed' ? 'bg-navy text-silver border-navy' : 'border-border hover:bg-gray-50'}`}
                  >Fixed</button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriceValue(p => ({ ...p, direction: 'increase' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${priceValue.direction === 'increase' ? 'bg-green-100 text-green-700 border-green-300' : 'border-border hover:bg-gray-50'}`}
                  >Increase</button>
                  <button
                    onClick={() => setPriceValue(p => ({ ...p, direction: 'decrease' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${priceValue.direction === 'decrease' ? 'bg-red-100 text-red-700 border-red-300' : 'border-border hover:bg-gray-50'}`}
                  >Decrease</button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceValue.amount}
                  onChange={e => setPriceValue(p => ({ ...p, amount: e.target.value }))}
                  placeholder={priceValue.type === 'percentage' ? 'Percentage (e.g. 10)' : 'Amount (e.g. 5.00)'}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowPriceModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
                <button
                  onClick={() => doBulk('adjustPrice', { type: priceValue.type, amount: parseFloat(priceValue.amount), direction: priceValue.direction })}
                  disabled={busy.size > 0 || !priceValue.amount}
                  className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
                >Apply</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Modal */}
      <AnimatePresence>
        {showStockModal && (
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
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy">Adjust Stock</h3>
                <button onClick={() => setShowStockModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setStockValue(s => ({ ...s, type: 'set' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${stockValue.type === 'set' ? 'bg-navy text-silver border-navy' : 'border-border hover:bg-gray-50'}`}
                  >Set</button>
                  <button
                    onClick={() => setStockValue(s => ({ ...s, type: 'add' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${stockValue.type === 'add' ? 'bg-green-100 text-green-700 border-green-300' : 'border-border hover:bg-gray-50'}`}
                  >Add</button>
                  <button
                    onClick={() => setStockValue(s => ({ ...s, type: 'subtract' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${stockValue.type === 'subtract' ? 'bg-red-100 text-red-700 border-red-300' : 'border-border hover:bg-gray-50'}`}
                  >Subtract</button>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={stockValue.amount}
                  onChange={e => setStockValue(s => ({ ...s, amount: e.target.value }))}
                  placeholder="Quantity"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowStockModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
                <button
                  onClick={() => doBulk('adjustStock', { type: stockValue.type, amount: parseInt(stockValue.amount, 10) })}
                  disabled={busy.size > 0 || stockValue.amount === ''}
                  className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
                >Apply</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
