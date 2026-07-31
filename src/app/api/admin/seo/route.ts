import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { sanitize } from '@/lib/sanitize'
import { storeDb } from '@/lib/store-scoped'

const SEO_KEYS = ['seoTitleTemplate','seoDescription','seoOgImage','seoKeywords','seoHomeTitle','seoHomeDescription','seoProductsTitle','seoProductsDescription','seoCategoriesTitle','seoCategoriesDescription','sitemapEnabled','sitemapPriority','sitemapChangefreq','robotsTxt']

const DEFAULTS: Record<string, string> = {
  seoTitleTemplate: '%s — Gümüş Güneş', seoDescription: 'Handcrafted premium accessories from Istanbul.',
  seoOgImage: '', seoKeywords: 'jewelry, silver, accessories',
  seoHomeTitle: 'Gümüş Güneş — Premium Accessories', seoHomeDescription: 'Discover handcrafted accessories.',
  seoProductsTitle: 'All Products — Gümüş Güneş', seoProductsDescription: 'Browse our collection.',
  seoCategoriesTitle: 'Categories — Gümüş Güneş', seoCategoriesDescription: 'Explore by category.',
  sitemapEnabled: 'true', sitemapPriority: '0.7', sitemapChangefreq: 'weekly',
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://gumusgunes.com/sitemap.xml',
}

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const settings = await sdb.siteSetting.findMany({ where: { key: { in: SEO_KEYS } } })
  const map = { ...DEFAULTS }; for (const s of settings) map[s.key] = s.value
  return NextResponse.json({ ok: true, settings: map })
}, 'marketing')

export const PUT = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    for (const [key, value] of Object.entries(body) as [string, string][]) {
      if (!SEO_KEYS.includes(key) || typeof value !== 'string') continue
      await sdb.siteSetting.upsert({ where: { key }, update: { value: sanitize(value) }, create: { key, value: sanitize(value) } as any })
    }
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
