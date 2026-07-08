'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ContentTone } from '@/lib/social/groq-content'

type Account = { id: string; accountName: string; platform: string }

export default function NewPost() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    accountId: '',
    platform: 'instagram',
    postType: 'feed',
    mediaUrls: '',
    caption: '',
    hashtags: '',
    scheduledAt: '',
    discountId: '',
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
    fetch('/api/admin/social/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  async function generateWithAI() {
    if (!productInput.name) {
      toast.error('Enter a product name first')
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
      toast.success('AI content generated!')
    } catch {
      toast.error('Failed to generate content. Check GROQ_API_KEY.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.mediaUrls) {
      toast.error('At least one media URL is required')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        mediaUrls: form.mediaUrls.split('\n').map(s => s.trim()).filter(Boolean),
        hashtags: form.hashtags ? form.hashtags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        scheduledAt: form.scheduledAt || undefined,
      }),
    })
    if (res.ok) {
      toast.success('Post created')
      router.push('/admin/social/posts')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to create post')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/social/posts" className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-2xl font-display font-semibold text-navy">New Post</h1>
      </div>

      <div className="p-6 rounded-2xl bg-secondary/20 border border-border/30 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" /> AI Content Generator
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            placeholder="Product name"
            value={productInput.name}
            onChange={e => setProductInput(p => ({ ...p, name: e.target.value }))}
            className="p-3 rounded-xl bg-background border border-border text-sm"
          />
          <input
            placeholder="Material (e.g. 14k Gold)"
            value={productInput.material}
            onChange={e => setProductInput(p => ({ ...p, material: e.target.value }))}
            className="p-3 rounded-xl bg-background border border-border text-sm"
          />
          <input
            placeholder="Price"
            type="number"
            value={productInput.price || ''}
            onChange={e => setProductInput(p => ({ ...p, price: Number(e.target.value) }))}
            className="p-3 rounded-xl bg-background border border-border text-sm"
          />
          <input
            placeholder="Tags (comma separated)"
            value={productInput.tags}
            onChange={e => setProductInput(p => ({ ...p, tags: e.target.value }))}
            className="p-3 rounded-xl bg-background border border-border text-sm"
          />
          <div className="md:col-span-2">
            <textarea
              placeholder="Product description"
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
            <Sparkles className="h-4 w-4" /> {generating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Platform</label>
            <select
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Post Type</label>
            <select
              value={form.postType}
              onChange={e => setForm(f => ({ ...f, postType: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="feed">Feed</option>
              <option value="reel">Reel</option>
              <option value="story">Story</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Account (optional)</label>
            <select
              value={form.accountId}
              onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="">No account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.accountName} ({a.platform})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Scheduled At (optional)</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy">Media URLs (one per line)</label>
          <textarea
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            value={form.mediaUrls}
            onChange={e => setForm(f => ({ ...f, mediaUrls: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm resize-none font-mono"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy">Caption</label>
          <textarea
            placeholder="Post caption..."
            value={form.caption}
            onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm resize-none"
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy">Hashtags (comma separated)</label>
          <input
            placeholder="#jewelry, #luxury, #gold"
            value={form.hashtags}
            onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  )
}
