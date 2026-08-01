'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { Star, RefreshCw, CheckCircle, XCircle, Trash2, MessageSquareText } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { ExportButton } from '@/components/admin/ExportButton'
import type { ColumnDef } from '@tanstack/react-table'

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      ))}
    </span>
  )
}

type Review = {
  id: string; productId: string
  product: { name: string; slug: string }
  authorName: string; authorEmail: string | null
  rating: number; title: string; comment: string
  isVerified: boolean; createdAt: string
}

export default function AdminReviews() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  function fetchReviews() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(pageSize))
    if (searchQuery) params.set('search', searchQuery)
    if (ratingFilter) params.set('rating', ratingFilter)
    if (verifiedFilter) params.set('verified', verifiedFilter)

    fetch(`/api/admin/reviews?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setReviews(Array.isArray(d.reviews) ? d.reviews : [])
          setTotal(d.total)
          setTotalPages(d.totalPages)
        } else {
          toast.error(ta(d.error || 'Failed to load reviews'))
        }
      })
      .catch(() => toast.error(ta('Failed to load reviews')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setPage(1)
  }, [searchQuery, ratingFilter, verifiedFilter, pageSize])

  useEffect(() => {
    fetchReviews()
  }, [page])

  async function toggleVerified(id: string) {
    setToggling(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'PUT' })
      const d = await res.json()
      if (d.ok) {
        setReviews(prev => prev.map(r => r.id === id ? d.review : r))
        toast.success(ta('Review updated'))
      } else {
        toast.error(ta(d.error || 'Failed to update review'))
      }
    } catch {
      toast.error(ta('Failed to update review'))
    } finally {
      setToggling(null)
    }
  }

  async function deleteReview(id: string) {
    if (!confirm(ta('Delete this review permanently?'))) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.ok) {
        setReviews(prev => prev.filter(r => r.id !== id))
        setTotal(prev => prev - 1)
        toast.success(ta('Review deleted'))
      } else {
        toast.error(ta(d.error || 'Failed to delete review'))
      }
    } catch {
      toast.error(ta('Failed to delete review'))
    } finally {
      setDeleting(null)
    }
  }

  const stats = useMemo(() => {
    if (reviews.length === 0 && total === 0) return { totalReviews: 0, avgRating: 0, fiveStar: 0, pendingVerification: 0 }
    const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
    return {
      totalReviews: total,
      avgRating: avg,
      fiveStar: reviews.filter(r => r.rating === 5).length,
      pendingVerification: reviews.filter(r => !r.isVerified).length,
    }
  }, [reviews, total])

  const hasActiveFilters = !!(searchQuery || ratingFilter || verifiedFilter)

  const columns: ColumnDef<Review>[] = [
    {
      accessorKey: 'product.name',
      header: ta('Product'),
      cell: ({ row }) => <span className="font-medium text-navy max-w-[180px] truncate block">{row.original.product.name}</span>,
    },
    {
      accessorKey: 'authorName',
      header: ta('Author'),
      cell: ({ row }) => (
        <div>
          <span className="text-muted-foreground">{row.original.authorName}</span>
          {row.original.authorEmail && <span className="text-xs block text-muted-foreground/70">{row.original.authorEmail}</span>}
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: ta('Rating'),
      cell: ({ row }) => <StarRating rating={row.original.rating} />,
    },
    {
      accessorKey: 'comment',
      header: ta('Comment'),
      cell: ({ row }) => <span className="text-muted-foreground max-w-[240px] truncate block">{row.original.comment}</span>,
    },
    {
      accessorKey: 'isVerified',
      header: ta('Verified'),
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${row.original.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.original.isVerified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {ta(row.original.isVerified ? 'Verified' : 'Unverified')}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ta('Date'),
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{fmtDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            disabled={toggling === row.original.id}
            onClick={e => { e.stopPropagation(); toggleVerified(row.original.id) }}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${row.original.isVerified ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
            title={ta(row.original.isVerified ? 'Unverify' : 'Verify')}
          >
            {toggling === row.original.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : row.original.isVerified ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
          </button>
          <button
            disabled={deleting === row.original.id}
            onClick={e => { e.stopPropagation(); deleteReview(row.original.id) }}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title={ta('Delete')}
          >
            {deleting === row.original.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Reviews')}
        actions={
          <ExportButton
            filename="reviews-export"
            columns={[
              { header: ta('Product'), key: 'product.name' },
              { header: ta('Author'), key: 'authorName' },
              { header: ta('Rating'), key: 'rating' },
              { header: ta('Comment'), key: 'comment' },
              { header: ta('Verified'), key: 'isVerified' },
            ]}
            data={reviews}
          />
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{ta('Total Reviews')}</p>
          <p className="text-2xl font-bold text-navy">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{ta('Avg Rating')}</p>
          <p className="text-2xl font-bold text-navy flex items-center gap-2">
            {stats.avgRating.toFixed(1)}
            <StarRating rating={Math.round(stats.avgRating)} size={14} />
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{ta('5-Star Reviews')}</p>
          <p className="text-2xl font-bold text-navy">{stats.fiveStar}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{ta('Pending Verification')}</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingVerification}</p>
        </div>
      </div>

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClearAll={() => { setSearchQuery(''); setRatingFilter(''); setVerifiedFilter(''); setPage(1) }}
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={ta('Search by product or author...')}
            className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={ratingFilter} onChange={e => { setRatingFilter(e.target.value); setPage(1) }} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600">
          <option value="">{ta('All Ratings')}</option>
          <option value="5">{ta('5 Stars')}</option>
          <option value="4">{ta('4 Stars')}</option>
          <option value="3">{ta('3 Stars')}</option>
          <option value="2">{ta('2 Stars')}</option>
          <option value="1">{ta('1 Star')}</option>
        </select>
        <select value={verifiedFilter} onChange={e => { setVerifiedFilter(e.target.value); setPage(1) }} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600">
          <option value="">{ta('All Reviews')}</option>
          <option value="verified">{ta('Verified')}</option>
          <option value="unverified">{ta('Unverified')}</option>
        </select>
        <button onClick={fetchReviews} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:text-navy flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> {ta('Refresh')}
        </button>
        <span className="text-xs text-muted-foreground ml-auto">{fmtNum(total)} {ta(total !== 1 ? 'reviews' : 'review')}</span>
      </FilterBar>

      <DataTable
        columns={columns}
        data={reviews}
        keyExtractor={(r) => r.id}
        loading={loading}
        onRowClick={(r) => setExpandedId(expandedId === r.id ? null : r.id)}
        emptyTitle={ta('No reviews found')}
        emptyDescription={searchQuery ? ta('Try adjusting your search terms') : undefined}
      />

      {/* Expanded comment */}
      {expandedId && (
        <div className="bg-gray-50/50 border border-border rounded-xl p-4 mt-2 mb-4">
          {(() => {
            const review = reviews.find(r => r.id === expandedId)
            if (!review) return null
            return (
              <div className="flex items-start gap-3">
                <MessageSquareText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  {review.title && <p className="font-medium text-navy mb-1">{review.title}</p>}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={s => { setPageSize(s); setPage(1) }}
      />
    </div>
  )
}
