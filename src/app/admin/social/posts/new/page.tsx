'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles, ArrowLeft, TrendingUp, Lightbulb, Hash } from 'lucide-react'
import Link from 'next/link'
import type { ContentTone } from '@/lib/social/groq-content'

type Account = { id: string; accountName: string; platform: string }

export default function NewPost() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'generate' | 'trends' | 'plan'>('generate')

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
  const [aiRegion, setAiRegion] = useState<'egypt' | 'global' | 'gulf'>('egypt')
  const [productInput, setProductInput] = useState({
    name: '',
    description: '',
    material: '',
    price: 0,
    tags: '',
  })

  const [trendData, setTrendData] = useState<any>(null)
  const [trendTopic, setTrendTopic] = useState('')
  const [trendNiche, setTrendNiche] = useState('')

  const [planData, setPlanData] = useState<any>(null)
  const [planCount, setPlanCount] = useState(5)

  useEffect(() => {
    fetch('/api/admin/social/accounts').then(r => r.json()).then(data => setAccounts(Array.isArray(data) ? data : []))
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
          action: 'post',
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

  async function analyzeTrend() {
    if (!trendTopic && !trendNiche) {
      toast.error('Enter a topic or niche to analyze')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/social/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trending',
          region: aiRegion,
          niche: trendNiche || undefined,
        }),
      })
      if (!res.ok) throw new Error('Trend analysis failed')
      const data = await res.json()
      setTrendData(data)

      if (trendTopic) {
        const analysisRes = await fetch('/api/admin/social/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze',
            topic: trendTopic,
            region: aiRegion,
          }),
        })
        if (analysisRes.ok) {
          const analysisData = await analysisRes.json()
          setTrendData((prev: any) => ({ ...prev, analysis: analysisData }))
        }
      }

      toast.success('Trend analysis complete!')
    } catch {
      toast.error('Failed to analyze trends')
    } finally {
      setGenerating(false)
    }
  }

  async function generateContentPlan() {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/social/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'contentPlan',
          products: productInput.name
            ? [{ name: productInput.name, tags: productInput.tags.split(',').map(t => t.trim()).filter(Boolean) }]
            : [],
          count: planCount,
        }),
      })
      if (!res.ok) throw new Error('Plan generation failed')
      const data = await res.json()
      setPlanData(data)
      toast.success('Content plan generated!')
    } catch {
      toast.error('Failed to generate content plan')
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
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/social/posts" className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-2xl font-display font-semibold text-navy">New Post</h1>
      </div>

      {/* AI Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 border border-border/30 w-fit">
        {[
          { id: 'generate' as const, label: 'Generate', icon: Sparkles },
          { id: 'trends' as const, label: 'Trends', icon: TrendingUp },
          { id: 'plan' as const, label: 'Content Plan', icon: Lightbulb },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-gold text-navy-deep' : 'text-muted-foreground hover:text-navy'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="p-6 rounded-2xl bg-secondary/20 border border-border/30 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" /> AI Content Generator
          </h2>
          <p className="text-xs text-muted-foreground">Brand: Gümüş Güneş — Egyptian stainless steel jewelry from Turkey. Arabic captions by default.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Product name"
              value={productInput.name}
              onChange={e => setProductInput(p => ({ ...p, name: e.target.value }))}
              className="p-3 rounded-xl bg-background border border-border text-sm"
            />
            <input
              placeholder="Material (e.g. ستانليس ستيل)"
              value={productInput.material}
              onChange={e => setProductInput(p => ({ ...p, material: e.target.value }))}
              className="p-3 rounded-xl bg-background border border-border text-sm"
            />
            <input
              placeholder="Price (EGP)"
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
              <option value="luxury">Luxury / فخم</option>
              <option value="casual">Casual / عادي</option>
              <option value="promotional">Promotional / عرض</option>
              <option value="educational">Educational / تعليمي</option>
            </select>
            <button
              onClick={generateWithAI}
              disabled={generating}
              className="px-4 py-2.5 bg-gold text-navy-deep rounded-full text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> {generating ? 'Generating...' : 'Generate بالعربي'}
            </button>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="p-6 rounded-2xl bg-secondary/20 border border-border/30 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" /> Trend Analysis & Hashtag Research
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="Topic to analyze (optional)"
              value={trendTopic}
              onChange={e => setTrendTopic(e.target.value)}
              className="p-3 rounded-xl bg-background border border-border text-sm"
            />
            <input
              placeholder="Niche (e.g. مجوهرات)"
              value={trendNiche}
              onChange={e => setTrendNiche(e.target.value)}
              className="p-3 rounded-xl bg-background border border-border text-sm"
            />
            <select
              value={aiRegion}
              onChange={e => setAiRegion(e.target.value as any)}
              className="p-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="egypt">مصر / Egypt</option>
              <option value="gulf">الخليج / Gulf</option>
              <option value="global">Global / عالمي</option>
            </select>
          </div>
          <button
            onClick={analyzeTrend}
            disabled={generating}
            className="px-4 py-2.5 bg-gold text-navy-deep rounded-full text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" /> {generating ? 'Analyzing...' : 'Analyze Trends'}
          </button>

          {trendData && (
            <div className="space-y-4 pt-4 border-t border-border/30">
              {trendData.analysis && (
                <div className="p-4 rounded-xl bg-background border border-border/50">
                  <h3 className="font-medium mb-2">Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-2">{trendData.analysis.summary}</p>
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trendData.analysis.trending ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {trendData.analysis.trending ? 'Trending 🔥' : 'Not trending'}
                    </span>
                    <span className="text-xs text-muted-foreground">Momentum: {trendData.analysis.momentum}</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-background border border-border/50">
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1"><Hash className="h-3 w-3" /> Trending</h3>
                  <div className="flex flex-wrap gap-1">
                    {(trendData.trending || []).map((h: string) => (
                      <span key={h} className="text-xs px-2 py-1 bg-gold/10 text-gold rounded-full">{h}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/50">
                  <h3 className="font-medium text-sm mb-2">Regional</h3>
                  <div className="flex flex-wrap gap-1">
                    {(trendData.regional || []).map((h: string) => (
                      <span key={h} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{h}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/50">
                  <h3 className="font-medium text-sm mb-2">Brand Suggestions</h3>
                  <div className="flex flex-wrap gap-1">
                    {(trendData.suggestions || []).map((h: string) => (
                      <span key={h} className="text-xs px-2 py-1 bg-navy-deep text-silver rounded-full">{h}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const all = [...(trendData.trending || []), ...(trendData.suggestions || [])].join(', ')
                  setForm(f => ({ ...f, hashtags: all }))
                  toast.success('Hashtags added to post!')
                }}
                className="text-sm text-gold hover:underline"
              >
                Use these hashtags
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content Plan Tab */}
      {activeTab === 'plan' && (
        <div className="p-6 rounded-2xl bg-secondary/20 border border-border/30 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-gold" /> Content Plan Generator
          </h2>
          <div className="flex items-center gap-3">
            <input
              placeholder="Number of posts"
              type="number"
              value={planCount}
              onChange={e => setPlanCount(Number(e.target.value))}
              className="w-24 p-3 rounded-xl bg-background border border-border text-sm"
              min={1}
              max={20}
            />
            <button
              onClick={generateContentPlan}
              disabled={generating}
              className="px-4 py-2.5 bg-gold text-navy-deep rounded-full text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" /> {generating ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>

          {planData && (
            <div className="space-y-4 pt-4 border-t border-border/30">
              {planData.contentMix && (
                <p className="text-sm text-muted-foreground">{planData.contentMix}</p>
              )}
              <div className="grid gap-3">
                {(planData.posts || []).map((post: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-background border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium">{post.postType}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{post.tone}</span>
                      {post.targetAudience && (
                        <span className="text-xs text-muted-foreground">{post.targetAudience}</span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm">{post.title || post.idea?.slice(0, 80)}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{post.idea}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(post.hashtags || []).map((h: string) => (
                        <span key={h} className="text-xs text-muted-foreground">{h}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {Array.isArray(planData.weekPlan) && planData.weekPlan.length > 0 && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <h3 className="font-medium text-sm mb-2">Weekly Plan</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {planData.weekPlan.map((item: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Post Form */}
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
            placeholder="#مجوهرات, #جوموش_جونش, #استانليس_ستيل"
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
