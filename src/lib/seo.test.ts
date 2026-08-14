import { describe, it, expect } from 'vitest'
import {
  applyTitleTemplate,
  blogIndexMetadata,
  blogMetadata,
  categoryMetadata,
  clampDescription,
  DESCRIPTION_MAX,
  productMetadata,
  productsIndexMetadata,
  seoFromSiteSettings,
} from './seo'

const SETTINGS = seoFromSiteSettings([
  { key: 'seoTitleTemplate', value: '%s — Gümüş Güneş' },
  { key: 'seoKeywords', value: 'jewelry, silver, accessories' },
])

describe('seoFromSiteSettings', () => {
  it('maps known keys and falls back to the default title template', () => {
    expect(seoFromSiteSettings([{ key: 'seoTitleTemplate', value: 'X %s' }])).toEqual({
      titleTemplate: 'X %s',
      ogImage: undefined,
      keywords: undefined,
    })
    expect(seoFromSiteSettings([]).titleTemplate).toBe('%s — Gümüş Güneş')
  })
})

describe('applyTitleTemplate', () => {
  it('substitutes %s in the default template', () => {
    expect(applyTitleTemplate('Gold Ring')).toBe('Gold Ring — Gümüş Güneş')
  })
  it('substitutes %s in a custom template', () => {
    expect(applyTitleTemplate('Gold Ring', SETTINGS)).toBe('Gold Ring — Gümüş Güneş')
  })
  it('appends the brand when the template has no %s', () => {
    expect(applyTitleTemplate('Gold Ring', { titleTemplate: 'Custom' })).toBe('Gold Ring — Gümüş Güneş')
  })
})

describe('clampDescription', () => {
  it('passes short text through unchanged', () => {
    expect(clampDescription('Short description.', 'fallback')).toBe('Short description.')
  })
  it('caps text at 160 chars and ends with an ellipsis without splitting words', () => {
    const long = 'word '.repeat(100)
    const out = clampDescription(long, 'fallback')
    expect(out.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toContain('  ')
  })
  it('collapses whitespace', () => {
    expect(clampDescription('a   b\n\t c', 'fallback')).toBe('a b c')
  })
  it('falls back when empty', () => {
    expect(clampDescription(null, 'Fallback text.')).toBe('Fallback text.')
  })
})

describe('productMetadata', () => {
  const product = {
    name: 'Celestial Ring',
    slug: 'celestial-ring',
    description: 'Handcrafted stainless steel ring.',
    imageUrl: 'https://cdn.example.com/ring.png',
  }
  it('builds unique titles via the template and relative canonical', () => {
    const a = productMetadata({ ...product, name: 'Celestial Ring' })
    const b = productMetadata({ ...product, name: 'Moon Pendant' })
    expect(a.title).toBe('Celestial Ring — Gümüş Güneş')
    expect(b.title).not.toBe(a.title)
    expect(a.alternates?.canonical).toBe('/products/celestial-ring')
  })
  it('keeps description within the length cap and wires keywords', () => {
    const md = productMetadata({ ...product, description: 'word '.repeat(60) }, SETTINGS)
    expect((md.description as string).length).toBeLessThanOrEqual(DESCRIPTION_MAX)
    expect(md.keywords).toBe('jewelry, silver, accessories')
  })
  it('falls back to the settings og image when the product has none', () => {
    const md = productMetadata({ ...product, imageUrl: null }, { ogImage: 'https://cdn.example.com/brand.png' })
    expect(md.openGraph?.images).toEqual([{ url: 'https://cdn.example.com/brand.png', width: 1200, height: 1200 }])
  })
})

describe('blogMetadata', () => {
  it('uses article type, canonical and post image', () => {
    const md = blogMetadata({
      title: 'How to Care for Jewelry',
      slug: 'care-guide',
      excerpt: 'A short excerpt.',
      featuredImage: 'https://cdn.example.com/care.png',
    })
    expect((md.openGraph as { type?: string }).type).toBe('article')
    expect(md.alternates?.canonical).toBe('/blog/care-guide')
    expect(md.twitter?.images).toEqual(['https://cdn.example.com/care.png'])
  })
  it('applies the settings template so titles stay unique', () => {
    const md = blogMetadata({ title: 'Care Guide', slug: 'care' }, SETTINGS)
    expect(md.title).toBe('Care Guide — Gümüş Güneş')
  })
})

describe('categoryMetadata', () => {
  it('canonical encodes the category slug', () => {
    const md = categoryMetadata({ name: 'Rings', slug: 'gold rings', description: null })
    expect(md.alternates?.canonical).toBe('/products?category=gold%20rings')
    expect(md.title).toBe('Rings — Gümüş Güneş')
  })
})

describe('index metadata', () => {
  it('products index has fixed canonical and template title', () => {
    const md = productsIndexMetadata(SETTINGS)
    expect(md.alternates?.canonical).toBe('/products')
    expect(md.title).toBe('All Collections — Gümüş Güneş')
  })
  it('blog index has fixed canonical and template title', () => {
    const md = blogIndexMetadata(SETTINGS)
    expect(md.alternates?.canonical).toBe('/blog')
    expect(md.title).toBe('Blog — Gümüş Güneş')
    expect((md.openGraph as { type?: string }).type).toBe('website')
  })
})
