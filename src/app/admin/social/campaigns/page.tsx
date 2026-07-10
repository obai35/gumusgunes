'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

type Campaign = {
  id: string
  name: string
  goal: string
  status: string
  budget: number | null
  startDate: string | null
  endDate: string | null
  triggerType: string | null
  createdAt: string
  _count: { posts: number }
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/social/campaigns')
      .then(r => r.json())
      .then(data => setCampaigns(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold">Campaigns</h1>
        <Link
          href="/admin/social/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-12 rounded-2xl bg-secondary/30 border border-border/30 text-center">
          <p className="text-muted-foreground">No campaigns yet. Create your first campaign to start automating your social media marketing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <Link
              key={c.id}
              href={`/admin/social/campaigns/${c.id}`}
              className="p-6 rounded-2xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-navy">{c.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[c.status] || 'bg-gray-100 text-gray-600'}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground capitalize">Goal: {c.goal}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{c._count.posts} posts</span>
                {c.budget && <span>E£{c.budget.toFixed(2)}</span>}
                {c.triggerType && <span className="capitalize">{c.triggerType}</span>}
              </div>
              {c.startDate && (
                <p className="text-xs text-muted-foreground">
                  {new Date(c.startDate).toLocaleDateString()}{c.endDate ? ` — ${new Date(c.endDate).toLocaleDateString()}` : ''}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
