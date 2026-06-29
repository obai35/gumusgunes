'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { ArrowUp, ShoppingBag } from 'lucide-react'
import { useHydrated } from '@/hooks/use-hydrated'
import { Header } from '@/components/store/Header'
import { Hero } from '@/components/store/Hero'
import { TrustBadges } from '@/components/store/TrustBadges'
import { CategoryGrid } from '@/components/store/CategoryGrid'
import { FeaturedProducts } from '@/components/store/FeaturedProducts'
import { ProductGrid } from '@/components/store/ProductGrid'
import { PromoBanner } from '@/components/store/PromoBanner'
import { AboutSection } from '@/components/store/AboutSection'
import { Footer } from '@/components/store/Footer'
import { DiamondLoading } from '@/components/store/DiamondLoading'
import { useCart, useWishlist, useUI } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'
import type { Product, Category } from '@/lib/types'

const CraftsmanshipTimeline = lazy(() => import('@/components/store/CraftsmanshipTimeline').then(m => ({ default: m.CraftsmanshipTimeline })))
const Testimonials = lazy(() => import('@/components/store/Testimonials').then(m => ({ default: m.Testimonials })))
const Newsletter = lazy(() => import('@/components/store/Newsletter').then(m => ({ default: m.Newsletter })))
const RecentlyViewed = lazy(() => import('@/components/store/RecentlyViewed').then(m => ({ default: m.RecentlyViewed })))
const RewardsSection = lazy(() => import('@/components/store/RewardsSection').then(m => ({ default: m.RewardsSection })))
const GiftFinder = lazy(() => import('@/components/store/GiftFinder').then(m => ({ default: m.GiftFinder })))
const BundleConfigurator = lazy(() => import('@/components/store/BundleConfigurator').then(m => ({ default: m.BundleConfigurator })))
const FlashSaleBanner = lazy(() => import('@/components/store/FlashSaleBanner').then(m => ({ default: m.FlashSaleBanner })))
const ProductModal = lazy(() => import('@/components/store/ProductModal').then(m => ({ default: m.ProductModal })))
const CartDrawer = lazy(() => import('@/components/store/CartDrawer').then(m => ({ default: m.CartDrawer })))
const CheckoutDialog = lazy(() => import('@/components/store/CheckoutDialog').then(m => ({ default: m.CheckoutDialog })))
const SearchDialog = lazy(() => import('@/components/store/SearchDialog').then(m => ({ default: m.SearchDialog })))
const WishlistDrawer = lazy(() => import('@/components/store/WishlistDrawer').then(m => ({ default: m.WishlistDrawer })))
const ConciergeChat = lazy(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))
const ExitIntentPopup = lazy(() => import('@/components/store/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })))
const CompareModal = lazy(() => import('@/components/store/CompareModal').then(m => ({ default: m.CompareModal })))
const CompareTray = lazy(() => import('@/components/store/CompareTray').then(m => ({ default: m.CompareTray })))
const OrderTrackingModal = lazy(() => import('@/components/store/OrderTrackingModal').then(m => ({ default: m.OrderTrackingModal })))

function SectionFallback() {
  return <div className="h-32 bg-secondary/20 animate-pulse rounded-2xl mx-4 my-8" />
}

export default function Home() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showTop, setShowTop] = useState(false)

  const { count, openCart } = useCart()
  const wishlist = useWishlist()
  const hydrated = useHydrated()

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products?limit=100').then((r) => r.json()),
    ])
      .then(([cats, prods]) => {
        if (cats.ok) setCategories(cats.categories)
        if (prods.ok) setProducts(prods.products)
      })
      .finally(() => setLoading(false))

    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get('wishlist')
      if (shared) {
        const decoded = atob(shared)
        const ids = decoded.split(',').filter(Boolean)
        const existing = wishlist.ids
        const merged = Array.from(new Set([...existing, ...ids]))
        merged.forEach((id) => {
          if (!wishlist.has(id)) wishlist.toggle(id)
        })
        setTimeout(() => {
          import('sonner').then(({ toast }) => {
            toast.success(t('page.sharedWishlistLoaded', ids.length.toString()), {
              description: t('page.sharedWishlistDesc'),
            })
          })
          useUI.getState().setWishlistOpen(true)
        }, 800)
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch {}

    const onScroll = () => setShowTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const featured = products.filter((p) => p.isFeatured).slice(0, 4)
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4)
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <Hero />
        <Suspense fallback={<SectionFallback />}><FlashSaleBanner /></Suspense>
        <TrustBadges />
        <CategoryGrid categories={categories} />

        {featured.length > 0 && (
          <FeaturedProducts
            id="featured"
            eyebrow={t('page.featured.eyebrow')}
            title={t('page.featured.title')}
            products={featured}
            ctaLabel={t('page.featured.cta')}
            ctaHref="#collections"
          />
        )}

        <PromoBanner />

        <Suspense fallback={<SectionFallback />}><BundleConfigurator /></Suspense>

        {newArrivals.length > 0 && (
          <FeaturedProducts
            id="new"
            eyebrow={t('page.newArrivals.eyebrow')}
            title={t('page.newArrivals.title')}
            products={newArrivals}
            ctaLabel={t('page.newArrivals.cta')}
            ctaHref="#collections"
          />
        )}

        <ProductGrid
          categories={categories}
          initialProducts={products}
        />

        {bestsellers.length > 0 && (
          <FeaturedProducts
            id="bestsellers"
            eyebrow={t('page.bestsellers.eyebrow')}
            title={t('page.bestsellers.title')}
            products={bestsellers}
            ctaLabel={t('page.bestsellers.cta')}
            ctaHref="#collections"
          />
        )}

        <Suspense fallback={<SectionFallback />}><RecentlyViewed allProducts={products} /></Suspense>
        <Suspense fallback={<SectionFallback />}><GiftFinder /></Suspense>

        <AboutSection />
        <Suspense fallback={<SectionFallback />}><CraftsmanshipTimeline /></Suspense>
        <Suspense fallback={<SectionFallback />}><Testimonials /></Suspense>
        <Suspense fallback={<SectionFallback />}><RewardsSection /></Suspense>
        <Suspense fallback={<SectionFallback />}><Newsletter /></Suspense>
      </main>

      <Footer />

      {/* Overlays */}
      <Suspense fallback={null}><ProductModal /></Suspense>
      <Suspense fallback={null}><CartDrawer /></Suspense>
      <Suspense fallback={null}><CheckoutDialog /></Suspense>
      <Suspense fallback={null}><SearchDialog /></Suspense>
      <Suspense fallback={null}><WishlistDrawer /></Suspense>
      <Suspense fallback={null}><CompareModal /></Suspense>
      <Suspense fallback={null}><OrderTrackingModal /></Suspense>
      <Suspense fallback={null}><ConciergeChat /></Suspense>
      <Suspense fallback={null}><ExitIntentPopup /></Suspense>
      <Suspense fallback={null}><CompareTray /></Suspense>

      {loading && <DiamondLoading text={t('page.loading')} />}

      {/* Floating action buttons */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`h-11 w-11 rounded-full bg-navy text-silver shadow-lg hover:bg-gold hover:text-navy-deep transition-all flex items-center justify-center ${
            showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          aria-label={t('page.backToTop')}
        >
          <ArrowUp className="h-5 w-5" />
        </button>

        {hydrated && count() > 0 && (
          <button
            onClick={openCart}
            className="sm:hidden h-14 px-5 rounded-full bg-gold text-navy-deep shadow-xl flex items-center gap-2 font-semibold text-sm"
          >
            <ShoppingBag className="h-5 w-5" />
            {t('page.viewBag', count().toString())}
          </button>
        )}
      </div>
    </div>
  )
}
