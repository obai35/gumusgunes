import { db } from '@/lib/db'
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || 'https://gumusgunes.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date; imageUrl: string | null }[] = []
  let categories: { slug: string; createdAt: Date }[] = []
  let blogPosts: { slug: string; updatedAt: Date }[] = []

  try {
    ;[products, categories, blogPosts] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true, imageUrl: true },
        take: 5000,
      }),
      db.category.findMany({
        where: { isVisible: true },
        select: { slug: true, createdAt: true },
      }),
      db.blogPost.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true },
      }),
    ])
  } catch {
    // DB unreachable during build — serve static pages only
  }

  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/collections`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/new-arrivals`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/bestsellers`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/gift-finder`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${BASE_URL}/shipping`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${BASE_URL}/returns`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
  ]

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: p.imageUrl ? [p.imageUrl] : undefined,
  }))

  const categoryPages = categories.map((c) => ({
    url: `${BASE_URL}/products?category=${c.slug}`,
    lastModified: c.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const blogPages = blogPosts.map((b) => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...productPages, ...categoryPages, ...blogPages]
}