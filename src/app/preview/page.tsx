import { Header } from '@/components/store/Header'
import { Hero } from '@/components/store/Hero'
import { TrustBadges } from '@/components/store/TrustBadges'
import { CategoryGrid } from '@/components/store/CategoryGrid'
import { FeaturedProducts } from '@/components/store/FeaturedProducts'
import { PromoBanner } from '@/components/store/PromoBanner'
import { ProductGrid } from '@/components/store/ProductGrid'
import { AboutSection } from '@/components/store/AboutSection'
import { Footer } from '@/components/store/Footer'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DEFAULTS: Record<string, string> = {
  siteName: 'Gümüş Güneş',
  tagline: 'Silver Sun — Handcrafted in Istanbul',
  logoUrl: '/gumusgunes-logo.jpeg',
  primaryFont: "'Inter', sans-serif",
  headingFont: "'Playfair Display', serif",
  primaryColor: '#0a1628',
  accentColor: '#c9a84c',
  bgColor: '#ffffff',
  textColor: '#1a1a2e',
  announcementText: 'Free Worldwide Shipping on Orders Over $250 · 30-Day Returns · Lifetime Warranty',
  announcementTextMobile: 'Free Shipping Over $250 · Lifetime Warranty',
  heroTitle: 'Silver That Tells Your Story',
  heroSubtitle: 'Handcrafted 925 sterling silver jewelry, inspired by the sun and the moon.',
}

export default async function PreviewPage() {
  const settings = await db.siteSetting.findMany()
  const map: Record<string, string> = { ...DEFAULTS }
  for (const s of settings) map[s.key] = s.value

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const [categoriesRes, productsRes] = await Promise.all([
    fetch(`${baseUrl}/api/categories`, { cache: 'no-store' }).catch(() => null),
    fetch(`${baseUrl}/api/products?limit=100`, { cache: 'no-store' }).catch(() => null),
  ])
  const categoriesData = categoriesRes?.ok ? await categoriesRes.json() : { categories: [] }
  const productsData = productsRes?.ok ? await productsRes.json() : { products: [] }
  const categories = categoriesData.categories || []
  const products = productsData.products || []

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
    <html>
      <head>
        <style>{style}</style>
      </head>
      <body>
        <div data-editable="announcement">
          <Header />
        </div>
        <main>
          <div data-editable="hero"><Hero /></div>
          <TrustBadges />
          <CategoryGrid categories={categories} />
          {featured.length > 0 && <FeaturedProducts id="featured" eyebrow="Curated for You" title="Featured Pieces" products={featured} ctaLabel="View All" ctaHref="#collections" />}
          <PromoBanner />
          <ProductGrid categories={categories} initialProducts={products} />
          {newArrivals.length > 0 && <FeaturedProducts id="new" eyebrow="Fresh from the Atelier" title="New Arrivals" products={newArrivals} ctaLabel="View All" ctaHref="#collections" />}
          {bestsellers.length > 0 && <FeaturedProducts id="bestsellers" eyebrow="Customer Favorites" title="Bestsellers" products={bestsellers} ctaLabel="View All" ctaHref="#collections" />}
          <AboutSection />
        </main>
        <div data-editable="footer"><Footer /></div>
      </body>
    </html>
  )
}
