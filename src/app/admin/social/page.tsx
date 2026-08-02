'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function SocialDashboard() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  useEffect(() => {
    fetch('/api/admin/social/accounts')
      .then(r => r.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-muted-foreground">{ta('Loading...')}</div>

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold">{ta('Social Media')}</h1>
        <Link
          href="/admin/social/settings"
          className="px-4 py-2 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors"
        >
          {ta('Settings')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50">
          <h2 className="font-semibold mb-2">{ta('Instagram')}</h2>
          {accounts.filter(a => a.platform === 'instagram').length > 0 ? (
            accounts.filter(a => a.platform === 'instagram').map(a => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.accountName}</p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{ta('Not connected')}</p>
          )}
        </div>
        <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50">
          <h2 className="font-semibold mb-2">{ta('Facebook')}</h2>
          {accounts.filter(a => a.platform === 'facebook').length > 0 ? (
            accounts.filter(a => a.platform === 'facebook').map(a => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.accountName}</p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{ta('Not connected')}</p>
          )}
        </div>
      </div>

      <Link href="/admin/social/agent" className="block bg-gradient-to-br from-navy to-navy-deep rounded-xl border border-gold/20 p-5 hover:border-gold/50 transition-all group mb-3">
        <div className="h-12 w-12 rounded-lg bg-gold/20 flex items-center justify-center mb-3 group-hover:bg-gold/30 transition-colors">
          <Bot className="h-6 w-6 text-gold" />
        </div>
        <h3 className="font-semibold text-silver mb-1">{ta('AI Agent')}</h3>
        <p className="text-xs text-silver/60">{ta('Trend analysis, video ideas, ad management & insights')}</p>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/social/posts', label: ta('Posts'), desc: ta('Create & schedule') },
          { href: '/admin/social/comments', label: ta('Comments'), desc: ta('Moderate replies') },
          { href: '/admin/social/analytics', label: ta('Analytics'), desc: ta('Performance data') },
          { href: '/admin/social/campaigns', label: ta('Campaigns'), desc: ta('Automated marketing') },
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
