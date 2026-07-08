'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit3, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

type SocialPost = {
  id: string
  platform: string
  postType: string
  status: string
  caption: string | null
  mediaUrls: string
  hashtags: string | null
  scheduledAt: string | null
  publishedAt: string | null
  errorLog: string | null
  account: { accountName: string; platform: string } | null
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-600',
  publishing: 'bg-yellow-100 text-yellow-600',
  published: 'bg-green-100 text-green-600',
  failed: 'bg-red-100 text-red-600',
}

export default function SocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  async function fetchPosts() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/admin/social/posts?${params}`)
    const data = await res.json()
    setPosts(data)
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [statusFilter])

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    const res = await fetch(`/api/admin/social/posts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Post deleted')
      fetchPosts()
    } else {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-navy">Social Posts</h1>
        <Link
          href="/admin/social/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'scheduled', 'publishing', 'published', 'failed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-navy text-silver'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-muted-foreground text-sm py-12 text-center">No posts found.</div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div
              key={post.id}
              className="p-4 rounded-xl bg-white border border-border/50 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[post.status] || 'bg-gray-100 text-gray-600'}`}>
                    {post.status}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase">{post.platform}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{post.postType}</span>
                  {post.account && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{post.account.accountName}</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-navy truncate">
                  {post.caption || <span className="italic text-muted-foreground">No caption</span>}
                </p>
                {post.scheduledAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                  </p>
                )}
                {post.errorLog && (
                  <p className="text-xs text-red-500 mt-1 truncate">{post.errorLog}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/admin/social/posts/${post.id}`}
                  className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <Edit3 className="h-4 w-4 text-muted-foreground" />
                </Link>
                <button
                  onClick={() => deletePost(post.id)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
