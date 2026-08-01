'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, ArrowRight, DollarSign, Package, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { DataTable } from '@/components/admin/DataTable'
import { FilterBar } from '@/components/admin/FilterBar'
import { Pagination } from '@/components/admin/Pagination'
import { BulkActionBar } from '@/components/admin/BulkActionBar'
import { ExportButton } from '@/components/admin/ExportButton'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { useDebounce } from '@/hooks/useDebounce'
import { ProductToggle } from './ProductToggle'
import type { ColumnDef } from '@tanstack/react-table'

type Category = { id: string; name: string }
type Product = {
  id: string; name: string; slug: string; sku: string; price: number; stock: number
  imageUrl: string; isActive: boolean; isFeatured: boolean
  category: { id: string; name: string }
}

export default function AdminProducts() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<Set<string>>(new Set())

  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [priceValue, setPriceValue] = useState({ type: 'percentage', amount: '', direction: 'increase' })
  const [stockValue, setStockValue] = useState({ type: 'set', amount: '' })
  const [categoryValue, setCategoryValue] = useState('')

  const debouncedSearch = useDebounce(searchQuery, 300)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      const res = await fetch(`/api/admin/products?${params}`)
      const data = await res.json()
      if (data.ok) {
        setProducts(Array.isArray(data.products) ? data.products : [])
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } else {
        toast.error(ta(data.error || 'Failed to load products'))
      }
    } catch {
      toast.error(ta('Failed to load products'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, categoryFilter, page, pageSize])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetch('/api/admin/products/categories')
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [debouncedSearch, categoryFilter, page, pageSize])

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
        toast.success(ta(`${action === 'toggleActive' ? (value !== false ? 'Activated' : 'Deactivated') : action === 'setFeatured' ? (value ? 'Set featured' : 'Unset featured') : action === 'setCategory' ? 'Category updated' : action === 'adjustPrice' ? 'Price adjusted' : 'Stock adjusted'} ${data.count} product(s)`))
        setSelectedIds(new Set())
        setCategoryValue('')
        setPriceValue({ type: 'percentage', amount: '', direction: 'increase' })
        setStockValue({ type: 'set', amount: '' })
        setShowPriceModal(false)
        setShowStockModal(false)
        fetchProducts()
      } else {
        toast.error(ta(data.error || 'Operation failed'))
      }
    } catch {
      toast.error(ta('Operation failed'))
    } finally {
      setBusy(new Set())
    }
  }

  const hasActiveFilters = !!(categoryFilter || searchQuery)

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: ta('Product'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.imageUrl} alt={row.original.name} className="h-10 w-10 rounded-lg object-cover" />
          <span className="font-medium text-navy">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'sku',
      header: ta('SKU'),
    },
    {
      accessorKey: 'category.name',
      header: ta('Category'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.category.name}</span>,
    },
    {
      accessorKey: 'price',
      header: ta('Price'),
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium text-navy">{fmtCurrency(row.original.price)}</span>,
    },
    {
      accessorKey: 'stock',
      header: ta('Stock'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.original.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {row.original.stock}
        </span>
      ),
    },
    {
      accessorKey: 'isFeatured',
      header: ta('Featured'),
      cell: ({ row }) => row.original.isFeatured ? (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
          <Star className="h-3 w-3" /> {ta('Featured')}
        </span>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'isActive',
      header: ta('Active'),
      cell: ({ row }) => <ProductToggle productId={row.original.id} field="isActive" value={row.original.isActive} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <Link href={`/admin/products/${row.original.id}/edit`} className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium">
            Edit <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Products')}
        actions={
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> {ta('Add Product')}
          </Link>
        }
      />

      <div className="space-y-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
              placeholder={ta('Search by name or SKU...')}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-border text-sm"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-border text-sm"
            >
              <option value="">{ta('All Categories')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ExportButton
              filename="products-export"
              columns={[
                { header: ta('Name'), key: 'name' },
                { header: ta('SKU'), key: 'sku' },
                { header: ta('Category'), key: 'category.name' },
                { header: ta('Price'), key: 'price' },
                { header: ta('Stock'), key: 'stock' },
              ]}
              data={products}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        loading={loading}
        selectable
        responsiveCards
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyTitle={ta(searchQuery ? 'No products match your search' : 'No products yet')}
        emptyDescription={ta(searchQuery ? 'Try adjusting your search terms' : 'Add your first product to get started')}
        emptyAction={searchQuery ? undefined : { label: ta('Add Product'), onClick: () => router.push('/admin/products/new') }}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={s => { setPageSize(s); setPage(1) }}
      />

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          { label: ta('Activate'), onClick: () => doBulk('toggleActive', true) },
          { label: ta('Deactivate'), onClick: () => doBulk('toggleActive', false), variant: 'destructive' },
          { label: ta('Set Featured'), onClick: () => doBulk('setFeatured', true) },
          { label: ta('Unset Featured'), onClick: () => doBulk('setFeatured', false), variant: 'outline' },
          { label: ta('Adjust Price'), onClick: () => setShowPriceModal(true) },
          { label: ta('Adjust Stock'), onClick: () => setShowStockModal(true) },
        ]}
      />

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
                <h3 className="font-semibold text-navy">{ta('Adjust Price')}</h3>
                <button onClick={() => setShowPriceModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriceValue(p => ({ ...p, type: 'percentage' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${priceValue.type === 'percentage' ? 'bg-navy text-silver border-navy' : 'border-border hover:bg-gray-50'}`}
                  >{ta('Percentage')}</button>
                  <button
                    onClick={() => setPriceValue(p => ({ ...p, type: 'fixed' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${priceValue.type === 'fixed' ? 'bg-navy text-silver border-navy' : 'border-border hover:bg-gray-50'}`}
                  >{ta('Fixed')}</button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriceValue(p => ({ ...p, direction: 'increase' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${priceValue.direction === 'increase' ? 'bg-green-100 text-green-700 border-green-300' : 'border-border hover:bg-gray-50'}`}
                  >{ta('Increase')}</button>
                  <button
                    onClick={() => setPriceValue(p => ({ ...p, direction: 'decrease' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${priceValue.direction === 'decrease' ? 'bg-red-100 text-red-700 border-red-300' : 'border-border hover:bg-gray-50'}`}
                  >{ta('Decrease')}</button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceValue.amount}
                  onChange={e => setPriceValue(p => ({ ...p, amount: e.target.value }))}
                  placeholder={ta(priceValue.type === 'percentage' ? 'Percentage (e.g. 10)' : 'Amount (e.g. 5.00)')}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowPriceModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">{ta('Cancel')}</button>
                <button
                  onClick={() => doBulk('adjustPrice', { type: priceValue.type, amount: parseFloat(priceValue.amount), direction: priceValue.direction })}
                  disabled={busy.size > 0 || !priceValue.amount}
                  className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
                >{ta('Apply')}</button>
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
                <h3 className="font-semibold text-navy">{ta('Adjust Stock')}</h3>
                <button onClick={() => setShowStockModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setStockValue(s => ({ ...s, type: 'set' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${stockValue.type === 'set' ? 'bg-navy text-silver border-navy' : 'border-border hover:bg-gray-50'}`}
                  >{ta('Set')}</button>
                  <button
                    onClick={() => setStockValue(s => ({ ...s, type: 'add' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${stockValue.type === 'add' ? 'bg-green-100 text-green-700 border-green-300' : 'border-border hover:bg-gray-50'}`}
                  >{ta('Add')}</button>
                  <button
                    onClick={() => setStockValue(s => ({ ...s, type: 'subtract' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${stockValue.type === 'subtract' ? 'bg-red-100 text-red-700 border-red-300' : 'border-border hover:bg-gray-50'}`}
                  >{ta('Subtract')}</button>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={stockValue.amount}
                  onChange={e => setStockValue(s => ({ ...s, amount: e.target.value }))}
                  placeholder={ta('Quantity')}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowStockModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">{ta('Cancel')}</button>
                <button
                  onClick={() => doBulk('adjustStock', { type: stockValue.type, amount: parseInt(stockValue.amount, 10) })}
                  disabled={busy.size > 0 || stockValue.amount === ''}
                  className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
                >{ta('Apply')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
