'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type Overview = {
  totalPosts: number
  publishedPosts: number
  scheduledPosts: number
  failedPosts: number
  totalAccounts: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalReach: number
  engagementRate: string
}

type TrendPoint = { date: string; reach: number; engagement: number; posts: number }

type PostSummary = {
  id: string
  postType: string
  status: string
  caption: string | null
  publishedAt: string | null
  performance: { likes: number; comments: number; shares: number; reach: number } | null
}

export default function AnalyticsDashboard() {
  const { ta, fmtNum, fmtDate } = useAdminTranslate()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [accounts, setAccounts] = useState<{ id: string; accountName: string; platform: string }[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [accountPosts, setAccountPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/social/analytics').then(r => r.json()),
      fetch('/api/admin/social/analytics/trends').then(r => r.json()),
      fetch('/api/admin/social/accounts').then(r => r.json()),
    ]).then(([ov, tr, accts]) => {
      setOverview(ov)
      setTrends(tr.trends || [])
      setAccounts(Array.isArray(accts) ? accts : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedAccount) {
      setAccountPosts([])
      return
    }
    fetch(`/api/admin/social/analytics/account/${selectedAccount}`)
      .then(r => r.json())
      .then(data => setAccountPosts(data.posts || []))
  }, [selectedAccount])

  if (loading) return <div className="p-8 text-muted-foreground">{ta('Loading...')}</div>

  const summaryCards = overview ? [
    { label: ta('Total Posts'), value: fmtNum(overview.totalPosts) },
    { label: ta('Published'), value: fmtNum(overview.publishedPosts) },
    { label: ta('Scheduled'), value: fmtNum(overview.scheduledPosts) },
    { label: ta('Engagement Rate'), value: `${overview.engagementRate}%` },
  ] : []

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold">{ta('Analytics')}</h1>
        <select
          value={selectedAccount}
          onChange={e => setSelectedAccount(e.target.value)}
          className="px-4 py-2 rounded-xl bg-background border border-border text-sm"
        >
          <option value="">{ta('All Accounts')}</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.accountName} ({a.platform})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className="p-5 rounded-2xl bg-secondary/40 border border-border/40">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold text-navy mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-secondary/30 border border-border/30">
          <h2 className="font-semibold mb-4">{ta('Reach Trend')}</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="reach" stroke="#1e3a5f" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">{ta('No trend data yet')}</p>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-secondary/30 border border-border/30">
          <h2 className="font-semibold mb-4">{ta('Engagement Breakdown')}</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="engagement" fill="#c9a84c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">{ta('No engagement data yet')}</p>
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-secondary/30 border border-border/30">
        <h2 className="font-semibold mb-4">{ta('Post Performance')}</h2>
        {accountPosts.length > 0 || overview && overview.publishedPosts > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">{ta('Caption')}</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">{ta('Type')}</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">{ta('Date')}</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">{ta('Likes')}</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">{ta('Comments')}</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">{ta('Shares')}</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">{ta('Reach')}</th>
                </tr>
              </thead>
              <tbody>
                {(accountPosts.length > 0 ? accountPosts : []).slice(0, 20).map(p => {
                  const perf = p.performance || { likes: 0, comments: 0, shares: 0, reach: 0 }
                  return (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/20">
                      <td className="px-3 py-2 max-w-[200px] truncate text-muted-foreground">
                        {p.caption || ta('No caption')}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-gold/10 text-gold uppercase">{p.postType}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {p.publishedAt ? fmtDate(p.publishedAt) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">{fmtNum(perf.likes)}</td>
                      <td className="px-3 py-2 text-right">{fmtNum(perf.comments)}</td>
                      <td className="px-3 py-2 text-right">{fmtNum(perf.shares)}</td>
                      <td className="px-3 py-2 text-right">{fmtNum(perf.reach)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">{ta('No published posts yet. Select an account to view its posts.')}</p>
        )}
      </div>
    </div>
  )
}
