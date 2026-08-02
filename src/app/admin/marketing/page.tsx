'use client'
import Link from 'next/link'
import { ShoppingCart, Tag, Mail, Bell, Search, Gift, Percent, Zap } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

const sections = [
  { href: '/admin/marketing/abandoned-carts', label: 'Abandoned Carts', desc: 'Recover lost sales', icon: ShoppingCart },
  { href: '/admin/marketing/coupons', label: 'Coupons', desc: 'Manage discount codes', icon: Tag },
  { href: '/admin/marketing/email-campaigns', label: 'Email Campaigns', desc: 'Send newsletters & promotions', icon: Mail },
  { href: '/admin/marketing/push-campaigns', label: 'Push Campaigns', desc: 'Send push notifications', icon: Bell },
  { href: '/admin/marketing/seo', label: 'SEO', desc: 'Meta titles, sitemaps & robots.txt', icon: Search },
  { href: '/admin/marketing/referrals', label: 'Referral Program', desc: 'Manage referrals & rewards', icon: Gift },
  { href: '/admin/marketing/gift-cards', label: 'Gift Cards', desc: 'Issue & track gift cards', icon: Percent },
  { href: '/admin/marketing/sales', label: 'Flash Sales', desc: 'Time-limited promotions', icon: Zap },
]

export default function MarketingDashboard() {
  const { ta } = useAdminTranslate()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">{ta('Marketing & Sales')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ta('Manage promotions, campaigns, and customer engagement')}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map(item => (
          <Link key={item.href} href={item.href}
            className="p-5 rounded-xl bg-white border border-border hover:shadow-md hover:border-gold/30 transition-all group">
            <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center mb-3 group-hover:bg-gold/20">
              <item.icon className="h-5 w-5 text-gold" />
            </div>
            <h3 className="font-semibold text-navy group-hover:text-gold">{ta(item.label)}</h3>
            <p className="text-xs text-muted-foreground mt-1">{ta(item.desc)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
