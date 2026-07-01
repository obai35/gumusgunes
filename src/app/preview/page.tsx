import { Header } from '@/components/store/Header'
import { Hero } from '@/components/store/Hero'
import { TrustBadges } from '@/components/store/TrustBadges'
import { FlashSaleBanner } from '@/components/store/FlashSaleBanner'
import { CategoryGrid } from '@/components/store/CategoryGrid'
import { FeaturedProducts } from '@/components/store/FeaturedProducts'
import { PromoBanner } from '@/components/store/PromoBanner'
import { ProductGrid } from '@/components/store/ProductGrid'
import { AboutSection } from '@/components/store/AboutSection'
import { Footer } from '@/components/store/Footer'
import { db } from '@/lib/db'
import { PreviewListener } from '@/components/preview/PreviewListener'

export const dynamic = 'force-dynamic'

const DEFAULTS: Record<string, string> = {
  siteName: 'Gümüş Güneş',
  tagline: 'Silver Sun — Premium Stainless Steel Accessories',
  logoUrl: '/gumusgunes-logo.jpeg',
  primaryFont: "'Inter', sans-serif",
  headingFont: "'Playfair Display', serif",
  primaryColor: '#0a1628',
  accentColor: '#c9a84c',
  bgColor: '#ffffff',
  textColor: '#1a1a2e',
  announcementText: 'Free Worldwide Shipping on Orders Over 250 EGP · 30-Day Returns',
  announcementTextMobile: 'Free Shipping Over 250 EGP',
  heroTitle: 'Silver That Tells Your Story',
  heroSubtitle: 'Handcrafted premium stainless steel accessories, inspired by the sun and the moon.',
  heroDescription: 'Each piece finished in our Istanbul atelier.',
  promoLimitedTime: 'Limited Time',
  promoHeading1: 'The Summer',
  promoHeading2: 'Solstice Collection',
  promoDescription: 'Up to 25% off selected pieces that celebrate the longest days of the year. Each purchase arrives in our signature gift box.',
  footerEmail: 'concierge@gumusgunes.com',
  footerPhone: '+90 212 000 00 00',
  footerAddress: 'Grand Bazaar, Nuruosmaniye No. 42, Istanbul, Türkiye',
  footerInstagram: 'https://instagram.com/gumusgunes',
  footerFacebook: 'https://facebook.com/gumusgunes',
  footerTwitter: 'https://twitter.com/gumusgunes',
  footerYoutube: 'https://youtube.com/@gumusgunes',
  footerCopyright: 'Gümüş Güneş Jewellery Ltd. All rights reserved.',
}

export default async function PreviewPage() {
  const [settings, categories, products] = await Promise.all([
    db.siteSetting.findMany(),
    db.category.findMany({
      orderBy: { name: 'asc' },
      include: { parent: { select: { id: true, name: true } }, _count: { select: { products: true } } },
    }),
    db.product.findMany({
      where: { isActive: true },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  const map: Record<string, string> = { ...DEFAULTS }
  for (const s of settings) map[s.key] = s.value

  const featured = products.filter((p: any) => p.isFeatured).slice(0, 4)
  const newArrivals = products.filter((p: any) => p.isNew).slice(0, 4)
  const bestsellers = products.filter((p: any) => p.isBestseller).slice(0, 4)

  const style = `
    :root {
      --color-navy: ${map.primaryColor};
      --color-gold: ${map.accentColor};
      --color-background: ${map.bgColor};
      --color-foreground: ${map.textColor};
      --font-sans: ${map.primaryFont};
      --font-display: ${map.headingFont};
    }
  `

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.__PREVIEW_SETTINGS__ = ${JSON.stringify(map)}` }} />
      <PreviewListener />
      <style>{style}</style>
      <div data-editable="announcement" data-editable-label="Announcement Bar">
        <Header />
      </div>
      <main>
        <div data-editable="hero" data-editable-label="Hero Section"><Hero /></div>
        <div data-editable="trust-badges" data-editable-label="Trust Badges"><TrustBadges /></div>
        <div data-editable="flash-sale" data-editable-label="Flash Sale"><FlashSaleBanner /></div>
        <div data-editable="category-grid" data-editable-label="Categories"><CategoryGrid categories={categories} /></div>
        {featured.length > 0 && <div data-editable="featured-products" data-editable-label="Featured Products"><FeaturedProducts id="featured" eyebrow="Curated for You" title="Featured Pieces" products={featured} ctaLabel="View All" ctaHref="#collections" /></div>}
        <div data-editable="promo-banner" data-editable-label="Promo Banner"><PromoBanner /></div>
        <div data-editable="product-grid"><ProductGrid categories={categories} initialProducts={products} /></div>
        {newArrivals.length > 0 && <div data-editable="new-arrivals" data-editable-label="New Arrivals"><FeaturedProducts id="new" eyebrow="Fresh from the Atelier" title="New Arrivals" products={newArrivals} ctaLabel="View All" ctaHref="#collections" /></div>}
        {bestsellers.length > 0 && <div data-editable="bestsellers" data-editable-label="Bestsellers"><FeaturedProducts id="bestsellers" eyebrow="Customer Favorites" title="Bestsellers" products={bestsellers} ctaLabel="View All" ctaHref="#collections" /></div>}
        <div data-editable="about-section" data-editable-label="About"><AboutSection /></div>
      </main>
      <div data-editable="footer" data-editable-label="Footer"><Footer /></div>
    </>
  )
}
