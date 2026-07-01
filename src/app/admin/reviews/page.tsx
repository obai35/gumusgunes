'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { Search, X, Star, Download, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trash2, RefreshCw, MessageSquareText } from 'lucide-react'

function exportCSVRows(rows: Record<string, any>[], filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

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
  id: string
  productId: string
  product: { name: string; slug: string }
  authorName: string
  authorEmail: string | null
  rating: number
  title: string
  comment: string
  isVerified: boolean
  createdAt: string
}

export default function AdminReviews() {
  const { token } = useAdminAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  function fetchReviews() {
    if (!token) return
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (searchQuery) params.set('search', searchQuery)
    if (ratingFilter) params.set('rating', ratingFilter)
    if (verifiedFilter) params.set('verified', verifiedFilter)

    fetch(`/api/admin/reviews?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setReviews(d.reviews)
          setTotal(d.total)
          setTotalPages(d.totalPages)
        } else {
          toast.error(d.error || 'Failed to load reviews')
        }
      })
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setPage(1)
  }, [searchQuery, ratingFilter, verifiedFilter])

  useEffect(() => {
    fetchReviews()
  }, [token, page])

  function handleSearch() {
    setPage(1)
    fetchReviews()
  }

  async function toggleVerified(id: string) {
    setToggling(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d.ok) {
        setReviews(prev => prev.map(r => r.id === id ? d.review : r))
        toast.success('Review updated')
      } else {
        toast.error(d.error || 'Failed to update review')
      }
    } catch {
      toast.error('Failed to update review')
    } finally {
      setToggling(null)
    }
  }

  async function deleteReview(id: string) {
    if (!confirm('Delete this review permanently?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d.ok) {
        setReviews(prev => prev.filter(r => r.id !== id))
        setTotal(prev => prev - 1)
        toast.success('Review deleted')
      } else {
        toast.error(d.error || 'Failed to delete review')
      }
    } catch {
      toast.error('Failed to delete review')
    } finally {
      setDeleting(null)
    }
  }

  function handleExportCSV() {
    const rows = reviews.map(r => ({
      Product: r.product.name,
      Author: r.authorName,
      Email: r.authorEmail || '',
      Rating: r.rating,
      Title: r.title,
      Comment: r.comment,
      Verified: r.isVerified ? 'Yes' : 'No',
      Date: new Date(r.createdAt).toLocaleDateString(),
    }))
    exportCSVRows(rows, `reviews-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const stats = useMemo(() => {
    if (reviews.length === 0 && total === 0) return { totalReviews: 0, avgRating: 0, fiveStar: 0, pendingVerification: 0 }
    const all = reviews
    const avg = all.length > 0 ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0
    return {
      totalReviews: total,
      avgRating: avg,
      fiveStar: total,
      pendingVerification: total,
    }
  }, [reviews, total])

  if (loading) return <div className="p-6 text-muted-foreground">Loading reviews...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Reviews</h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Reviews</p>
          <p className="text-2xl font-bold text-navy">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-navy flex items-center gap-2">
            {stats.avgRating.toFixed(1)}
            <StarRating rating={Math.round(stats.avgRating)} size={14} />
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">5-Star Reviews</p>
          <p className="text-2xl font-bold text-navy">{reviews.filter(r => r.rating === 5).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending Verification</p>
          <p className="text-2xl font-bold text-amber-600">{reviews.filter(r => !r.isVerified).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by product or author..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border text-sm"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={ratingFilter} onChange={e => { setRatingFilter(e.target.value); setPage(1) }} className="px-3 py-2 rounded-lg border border-border text-sm">
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        <select value={verifiedFilter} onChange={e => { setVerifiedFilter(e.target.value); setPage(1) }} className="px-3 py-2 rounded-lg border border-border text-sm">
          <option value="">All Reviews</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <button onClick={fetchReviews} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
        <span className="text-xs text-muted-foreground">{total} review{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Author</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Comment</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verified</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <>
                <tr
                  key={review.id}
                  className="border-b border-border/50 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                >
                  <td className="px-4 py-3 font-medium text-navy max-w-[180px] truncate">{review.product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {review.authorName}
                    {review.authorEmail && <span className="text-xs block text-muted-foreground/70">{review.authorEmail}</span>}
                  </td>
                  <td className="px-4 py-3"><StarRating rating={review.rating} /></td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[240px]">
                    <span className="line-clamp-1">{review.comment}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${review.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {review.isVerified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {review.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(review.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        disabled={toggling === review.id}
                        onClick={e => { e.stopPropagation(); toggleVerified(review.id) }}
                        className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${review.isVerified ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={review.isVerified ? 'Unverify' : 'Verify'}
                      >
                        {toggling === review.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : review.isVerified ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        disabled={deleting === review.id}
                        onClick={e => { e.stopPropagation(); deleteReview(review.id) }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        {deleting === review.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === review.id && (
                  <tr key={`${review.id}-expanded`} className="bg-gray-50/50 border-b border-border/50">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <MessageSquareText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          {review.title && <p className="font-medium text-navy mb-1">{review.title}</p>}
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {reviews.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No reviews found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
