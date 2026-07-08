'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MessageCircle, Send } from 'lucide-react'

type Account = { id: string; accountName: string; platform: string }
type Post = { id: string; caption: string | null; platformPostId: string | null }
type Comment = {
  id: string
  from: { id: string; username: string }
  message: string
  timestamp: string
  replyCount: number
}

export default function SocialComments() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedPostId, setSelectedPostId] = useState('')
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [sendingReply, setSendingReply] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/social/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  async function loadPosts(accountId: string) {
    if (!accountId) return
    const res = await fetch(`/api/admin/social/posts?accountId=${accountId}`)
    const data = await res.json()
    setPosts(data.filter((p: Post) => p.platformPostId))
    setSelectedPostId('')
    setComments([])
  }

  async function loadComments(postId: string) {
    if (!postId) return
    setLoading(true)
    const post = posts.find(p => p.id === postId)
    if (!post?.platformPostId) {
      toast.error('This post has no platform ID')
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/admin/social/comments?postId=${post.platformPostId}`)
      const data = await res.json()
      setComments(data)
    } catch {
      toast.error('Failed to load comments')
    }
    setLoading(false)
  }

  async function sendReply(commentId: string) {
    const message = replies[commentId]?.trim()
    if (!message) return
    setSendingReply(commentId)
    try {
      const res = await fetch('/api/admin/social/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, message }),
      })
      if (res.ok) {
        toast.success('Reply sent!')
        setReplies(r => ({ ...r, [commentId]: '' }))
        loadComments(selectedPostId)
      } else {
        toast.error('Failed to send reply')
      }
    } catch {
      toast.error('Failed to send reply')
    }
    setSendingReply(null)
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-display font-semibold text-navy flex items-center gap-2">
        <MessageCircle className="h-6 w-6" /> Comments Inbox
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-navy">Select Account</label>
          <select
            value={selectedAccountId}
            onChange={e => { setSelectedAccountId(e.target.value); loadPosts(e.target.value) }}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
          >
            <option value="">Choose an account...</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.accountName} ({a.platform})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-navy">Select Post</label>
          <select
            value={selectedPostId}
            onChange={e => { setSelectedPostId(e.target.value); loadComments(e.target.value) }}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            disabled={!selectedAccountId}
          >
            <option value="">Choose a post...</option>
            {posts.map(p => (
              <option key={p.id} value={p.id}>
                {(p.caption || 'Untitled').slice(0, 60)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-muted-foreground text-sm py-12 text-center">Loading comments...</div>}

      {!loading && comments.length === 0 && selectedPostId && (
        <div className="text-muted-foreground text-sm py-12 text-center">No comments yet.</div>
      )}

      <div className="space-y-3">
        {comments.map(comment => (
          <div
            key={comment.id}
            className="p-4 rounded-xl bg-white border border-border/50"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-medium text-sm text-navy">@{comment.from.username}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(comment.timestamp).toLocaleString()}
                </span>
              </div>
              {comment.replyCount > 0 && (
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                  {comment.replyCount} replies
                </span>
              )}
            </div>
            <p className="text-sm text-navy mb-3">{comment.message}</p>
            <div className="flex items-center gap-2">
              <input
                placeholder="Write a reply..."
                value={replies[comment.id] || ''}
                onChange={e => setReplies(r => ({ ...r, [comment.id]: e.target.value }))}
                className="flex-1 p-2 rounded-lg bg-background border border-border text-sm"
              />
              <button
                onClick={() => sendReply(comment.id)}
                disabled={sendingReply === comment.id || !replies[comment.id]?.trim()}
                className="p-2 rounded-lg bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
