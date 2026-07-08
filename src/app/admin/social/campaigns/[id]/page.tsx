'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Trash2, Play, Pause, CheckCircle } from 'lucide-react'

type Post = {
  id: string
  postType: string
  status: string
  caption: string | null
  mediaUrls: string
  hashtags: string | null
  scheduledAt: string | null
  publishedAt: string | null
  platform: string
  account: { accountName: string; platform: string } | null
}

type Campaign = {
  id: string
  name: string
  goal: string
  status: string
  budget: number | null
  startDate: string | null
  endDate: string | null
  triggerType: string | null
  triggerConfig: any
  createdAt: string
  posts: Post[]
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default function CampaignDetail() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/social/campaigns/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error)
          router.push('/admin/social/campaigns')
          return
        }
        setCampaign(data)
      })
      .finally(() => setLoading(false))
  }, [params.id, router])

  async function updateStatus(status: string) {
    const res = await fetch(`/api/admin/social/campaigns/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(`Campaign ${status}`)
      setCampaign(prev => prev ? { ...prev, status } : null)
      if (status === 'active') {
        fetch(`/api/admin/social/campaigns/${params.id}`)
          .then(r => r.json())
          .then(setCampaign)
      }
    } else {
      toast.error('Failed to update status')
    }
  }

  async function deleteCampaign() {
    if (!confirm('Delete this campaign and all its posts?')) return
    const res = await fetch(`/api/admin/social/campaigns/${params.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Campaign deleted')
      router.push('/admin/social/campaigns')
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>
  if (!campaign) return null

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold">{campaign.name}</h1>
            <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${statusStyles[campaign.status] || 'bg-gray-100 text-gray-600'}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 capitalize">Goal: {campaign.goal}</p>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'draft' && (
            <button onClick={() => updateStatus('active')} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
              <Play className="h-4 w-4" /> Activate
            </button>
          )}
          {campaign.status === 'active' && (
            <button onClick={() => updateStatus('paused')} className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 transition-colors">
              <Pause className="h-4 w-4" /> Pause
            </button>
          )}
          {campaign.status === 'paused' && (
            <button onClick={() => updateStatus('active')} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
              <Play className="h-4 w-4" /> Resume
            </button>
          )}
          {campaign.status !== 'completed' && (
            <button onClick={() => updateStatus('completed')} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
              <CheckCircle className="h-4 w-4" /> Complete
            </button>
          )}
          <button onClick={deleteCampaign} className="flex items-center gap-1.5 px-4 py-2 text-destructive border border-destructive/30 rounded-full text-sm font-medium hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-secondary/40 border border-border/40">
          <p className="text-xs text-muted-foreground">Total Posts</p>
          <p className="text-xl font-semibold text-navy">{campaign.posts.length}</p>
        </div>
        {campaign.budget && (
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/40">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-xl font-semibold text-navy">E£{campaign.budget.toFixed(2)}</p>
          </div>
        )}
        {campaign.triggerType && (
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/40">
            <p className="text-xs text-muted-foreground">Trigger</p>
            <p className="text-xl font-semibold text-navy capitalize">{campaign.triggerType}</p>
          </div>
        )}
        {campaign.startDate && (
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/40">
            <p className="text-xs text-muted-foreground">Date Range</p>
            <p className="text-sm font-medium text-navy">
              {new Date(campaign.startDate).toLocaleDateString()}
              {campaign.endDate ? ` — ${new Date(campaign.endDate).toLocaleDateString()}` : ''}
            </p>
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-secondary/30 border border-border/30">
        <h2 className="font-semibold mb-4">Posts</h2>
        {campaign.posts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No posts in this campaign yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Account</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Caption</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Scheduled</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Published</th>
                </tr>
              </thead>
              <tbody>
                {campaign.posts.map(p => (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="px-3 py-2 text-xs">
                      {p.account ? `${p.account.accountName} (${p.account.platform})` : '-'}
                    </td>
                    <td className="px-3 py-2 max-w-[250px] truncate text-muted-foreground">
                      {p.caption || 'No caption'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-gold/10 text-gold uppercase">{p.postType}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'published' ? 'bg-green-100 text-green-700' :
                        p.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
