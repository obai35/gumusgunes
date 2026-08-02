'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import type { ContentTone } from '@/lib/social/groq-content'

type Account = { id: string; accountName: string; platform: string }
type Post = {
  id: string
  accountId: string | null
  platform: string
  postType: string
  status: string
  mediaUrls: string
  caption: string | null
  hashtags: string | null
  productIds: string | null
  discountId: string | null
  scheduledAt: string | null
  publishedAt: string | null
  platformPostId: string | null
  errorLog: string | null
  account: Account | null
}

export default function EditPost() {
  const { ta } = useAdminTranslate()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [form, setForm] = useState({
    accountId: '',
    platform: 'instagram',
    postType: 'feed',
    status: 'draft',
    mediaUrls: '',
    caption: '',
    hashtags: '',
    scheduledAt: '',
  })

  const [aiTone, setAiTone] = useState<ContentTone>('luxury')
  const [productInput, setProductInput] = useState({
    name: '',
    description: '',
    material: '',
    price: 0,
    tags: '',
  })

  useEffect(() => {
    fetch('/api/admin/social/accounts').then(r => r.json()).then(data => setAccounts(Array.isArray(data) ? data : []))
    fetch(`/api/admin/social/posts/${id}`).then(r => r.json()).then((post: Post) => {
      setForm({
        accountId: post.accountId || '',
        platform: post.platform,
        postType: post.postType,
        status: post.status,
        mediaUrls: (() => { try { return JSON.parse(post.mediaUrls).join('\n') } catch { return post.mediaUrls } })(),
        caption: post.caption || '',
        hashtags: (() => { try { const h = JSON.parse(post.hashtags || '[]'); return Array.isArray(h) ? h.join(', ') : '' } catch { return post.hashtags || '' } })(),
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
      })
      setLoading(false)
    }).catch(() => {
      toast.error(ta('Post not found'))
      router.push('/admin/social/posts')
    })
  }, [id])

  async function generateWithAI() {
    if (!productInput.name) {
      toast.error(ta('Enter a product name first'))
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/social/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            ...productInput,
            tags: productInput.tags.split(',').map(t => t.trim()).filter(Boolean),
            price: Number(productInput.price),
          },
          postType: form.postType,
          tone: aiTone,
        }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setForm(f => ({
        ...f,
        caption: data.caption || f.caption,
        hashtags: data.hashtags?.join(', ') || f.hashtags,
      }))
      toast.success(ta('AI content generated!'))
    } catch {
      toast.error(ta('Failed to generate content. Check GROQ_API_KEY.'))
    } finally {
      setGenerating(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const body: any = {
      ...form,
      mediaUrls: form.mediaUrls.split('\n').map(s => s.trim()).filter(Boolean),
      hashtags: form.hashtags ? form.hashtags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      scheduledAt: form.scheduledAt || null,
    }
    if (!body.accountId) { body.accountId = null }
    const res = await fetch(`/api/admin/social/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success(ta('Post updated'))
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || ta('Failed to update'))
    }
    setSaving(false)
  }

  async function publishNow() {
    setSaving(true)
    const res = await fetch(`/api/admin/social/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    if (res.ok) {
      toast.success(ta('Post published!'))
      router.refresh()
    } else {
      toast.error(ta('Failed to publish'))
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-muted-foreground">{ta('Loading...')}</div>

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/social/posts" className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-2xl font-display font-semibold text-navy">{ta('Edit Post')}</h1>
      </div>

      <div className="p-6 rounded-2xl bg-secondary/20 border border-border/30 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" /> {ta('AI Content Generator')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            placeholder={ta('Product name')}
            value={productInput.name}
            onChange={e => setProductInput(p => ({ ...p, name: e.target.value }))}
            className="p-3 rounded-xl bg-background border border-border text-sm"
          />
          <input
            placeholder={ta('Material')}
            value={productInput.material}
            onChange={e => setProductInput(p => ({ ...p, material: e.target.value }))}
            className="p-3 rounded-xl bg-background border border-border text-sm"
          />
          <input
            placeholder={ta('Price')}
            type="number"
            value={productInput.price || ''}
            onChange={e => setProductInput(p => ({ ...p, price: Number(e.target.value) }))}
            className="p-3 rounded-xl bg-background border border-border text-sm"
          />
          <input
            placeholder={ta('Tags (comma separated)')}
            value={productInput.tags}
            onChange={e => setProductInput(p => ({ ...p, tags: e.target.value }))}
            className="p-3 rounded-xl bg-background border border-border text-sm"
          />
          <div className="md:col-span-2">
            <textarea
              placeholder={ta('Product description')}
              value={productInput.description}
              onChange={e => setProductInput(p => ({ ...p, description: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm resize-none"
              rows={2}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={aiTone}
            onChange={e => setAiTone(e.target.value as ContentTone)}
            className="p-2.5 rounded-xl bg-background border border-border text-sm"
          >
            <option value="luxury">Luxury</option>
            <option value="casual">Casual</option>
            <option value="promotional">Promotional</option>
            <option value="educational">Educational</option>
          </select>
          <button
            onClick={generateWithAI}
            disabled={generating}
            className="px-4 py-2.5 bg-gold text-navy-deep rounded-full text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> {generating ? ta('Generating...') : ta('Generate Content')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">{ta('Platform')}</label>
            <select
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="instagram">{ta('Instagram')}</option>
              <option value="facebook">{ta('Facebook')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">{ta('Post Type')}</label>
            <select
              value={form.postType}
              onChange={e => setForm(f => ({ ...f, postType: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="feed">{ta('Feed')}</option>
              <option value="reel">{ta('Reel')}</option>
              <option value="story">{ta('Story')}</option>
              <option value="carousel">{ta('Carousel')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">{ta('Status')}</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="draft">{ta('Draft')}</option>
              <option value="scheduled">{ta('Scheduled')}</option>
              <option value="published">{ta('Published')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">{ta('Account')}</label>
            <select
              value={form.accountId}
              onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="">{ta('No account')}</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.accountName} ({a.platform})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy">{ta('Media URLs (one per line)')}</label>
          <textarea
            value={form.mediaUrls}
            onChange={e => setForm(f => ({ ...f, mediaUrls: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm resize-none font-mono"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy">{ta('Caption')}</label>
          <textarea
            value={form.caption}
            onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm resize-none"
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy">{ta('Hashtags (comma separated)')}</label>
          <input
            value={form.hashtags}
            onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors disabled:opacity-50"
          >
            {saving ? ta('Saving...') : ta('Save Changes')}
          </button>
          {form.status !== 'published' && (
            <button
              type="button"
              onClick={publishNow}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" /> {ta('Publish Now')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
