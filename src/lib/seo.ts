import type { Metadata } from 'next'

export const SITE_NAME = 'Gümüş Güneş'
export const SITE_URL = 'https://gumusgunes.com'
export const DEFAULT_TITLE_TEMPLATE = '%s — Gümüş Güneş'
export const DESCRIPTION_MAX = 160

export const SEO_SETTING_KEYS = ['seoTitleTemplate', 'seoOgImage', 'seoKeywords'] as const

export interface SeoSettings {
  titleTemplate?: string
  ogImage?: string
  keywords?: string
}

export interface ProductSeoInput {
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
}

export interface BlogPostSeoInput {
  title: string
  slug: string
  excerpt?: string | null
  featuredImage?: string | null
}

export interface CategorySeoInput {
  name: string
  slug: string
  description?: string | null
}

export function seoFromSiteSettings(rows: { key: string; value: string }[]): SeoSettings {
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value
  return {
    titleTemplate: map.seoTitleTemplate || DEFAULT_TITLE_TEMPLATE,
    ogImage: map.seoOgImage || undefined,
    keywords: map.seoKeywords || undefined,
  }
}

export function applyTitleTemplate(title: string, settings?: SeoSettings): string {
  const template = settings?.titleTemplate || DEFAULT_TITLE_TEMPLATE
  if (template.includes('%s')) return template.replace('%s', title)
  return `${title} — ${SITE_NAME}`
}

export function clampDescription(text: string | null | undefined, fallback: string): string {
  const normalized = (text ?? '').trim().replace(/\s+/g, ' ')
  const base = normalized || fallback
  if (base.length <= DESCRIPTION_MAX) return base
  const cut = base.slice(0, DESCRIPTION_MAX - 1)
  const space = cut.lastIndexOf(' ')
  const trimmed = space > 0 ? cut.slice(0, space) : cut
  return `${trimmed}…`.slice(0, DESCRIPTION_MAX)
}

function ogImages(url: string, width: number, height: number) {
  return [{ url, width, height }]
}

/** Product detail metadata — one unique title/description per catalog page. */
export function productMetadata(product: ProductSeoInput, settings?: SeoSettings): Metadata {
  const title = applyTitleTemplate(product.name, settings)
  const description = clampDescription(
    product.description,
    `Shop ${product.name} — handcrafted stainless steel jewelry from ${SITE_NAME}.`,
  )
  const image = product.imageUrl || settings?.ogImage
  return {
    title,
    description,
    keywords: settings?.keywords,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      images: image ? ogImages(image, 1200, 1200) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

/** Blog post metadata — article Open Graph type, unique per post. */
export function blogMetadata(post: BlogPostSeoInput, settings?: SeoSettings): Metadata {
  const title = applyTitleTemplate(post.title, settings)
  const description = clampDescription(post.excerpt, `Read ${post.title} on the ${SITE_NAME} blog.`)
  const image = post.featuredImage || settings?.ogImage
  return {
    title,
    description,
    keywords: settings?.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      images: image ? ogImages(image, 1200, 630) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

/** Category landing metadata — filters the catalog at /products?category={slug}. */
export function categoryMetadata(category: CategorySeoInput, settings?: SeoSettings): Metadata {
  const title = applyTitleTemplate(category.name, settings)
  const description = clampDescription(
    category.description,
    `Shop ${category.name} — handcrafted stainless steel jewelry from ${SITE_NAME}.`,
  )
  return {
    title,
    description,
    keywords: settings?.keywords,
    alternates: { canonical: `/products?category=${encodeURIComponent(category.slug)}` },
    openGraph: {
      title,
      description,
      images: settings?.ogImage ? ogImages(settings.ogImage, 1200, 630) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: settings?.ogImage ? [settings.ogImage] : undefined,
    },
  }
}

/** Catalog index metadata. */
export function productsIndexMetadata(settings?: SeoSettings): Metadata {
  const title = applyTitleTemplate('All Collections', settings)
  const description =
    'Explore our handcrafted stainless steel accessories — rings, necklaces, earrings, bracelets, and pendants.'
  return {
    title,
    description,
    keywords: settings?.keywords,
    alternates: { canonical: '/products' },
    openGraph: {
      title,
      description,
      images: settings?.ogImage ? ogImages(settings.ogImage, 1200, 630) : undefined,
    },
  }
}

/** Blog index metadata. */
export function blogIndexMetadata(settings?: SeoSettings): Metadata {
  const title = applyTitleTemplate('Blog', settings)
  const description =
    'Guides, inspiration, and stories behind our handcrafted stainless steel accessories — rings, necklaces, earrings, bracelets, and pendants.'
  return {
    title,
    description,
    keywords: settings?.keywords,
    alternates: { canonical: '/blog' },
    openGraph: {
      title,
      description,
      type: 'website',
      images: settings?.ogImage ? ogImages(settings.ogImage, 1200, 630) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: settings?.ogImage ? [settings.ogImage] : undefined,
    },
  }
}