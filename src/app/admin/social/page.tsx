'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SocialDashboard() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/social/accounts')
      .then(r => r.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold">Social Media</h1>
        <Link
          href="/admin/social/settings"
          className="px-4 py-2 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors"
        >
          Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50">
          <h2 className="font-semibold mb-2">Instagram</h2>
          {accounts.filter(a => a.platform === 'instagram').length > 0 ? (
            accounts.filter(a => a.platform === 'instagram').map(a => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.accountName}</p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Not connected</p>
          )}
        </div>
        <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50">
          <h2 className="font-semibold mb-2">Facebook</h2>
          {accounts.filter(a => a.platform === 'facebook').length > 0 ? (
            accounts.filter(a => a.platform === 'facebook').map(a => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.accountName}</p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Not connected</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/social/posts', label: 'Posts', desc: 'Create & schedule' },
          { href: '/admin/social/comments', label: 'Comments', desc: 'Moderate replies' },
          { href: '/admin/social/analytics', label: 'Analytics', desc: 'Performance data' },
          { href: '/admin/social/campaigns', label: 'Campaigns', desc: 'Automated marketing' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/60 transition-colors"
          >
            <h3 className="font-medium text-navy">{item.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
