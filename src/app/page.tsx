'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, ShoppingBag } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Hero } from '@/components/store/Hero'
import { TrustBadges } from '@/components/store/TrustBadges'
import { CategoryGrid } from '@/components/store/CategoryGrid'
import { FeaturedProducts } from '@/components/store/FeaturedProducts'
import { ProductGrid } from '@/components/store/ProductGrid'
import { PromoBanner } from '@/components/store/PromoBanner'
import { AboutSection } from '@/components/store/AboutSection'
import { CraftsmanshipTimeline } from '@/components/store/CraftsmanshipTimeline'
import { Testimonials } from '@/components/store/Testimonials'
import { Newsletter } from '@/components/store/Newsletter'
import { RecentlyViewed } from '@/components/store/RecentlyViewed'
import { Footer } from '@/components/store/Footer'
import { ProductModal } from '@/components/store/ProductModal'
import { CartDrawer } from '@/components/store/CartDrawer'
import { CheckoutDialog } from '@/components/store/CheckoutDialog'
import { SearchDialog } from '@/components/store/SearchDialog'
import { WishlistDrawer } from '@/components/store/WishlistDrawer'
import { ConciergeChat } from '@/components/store/ConciergeChat'
import { ExitIntentPopup } from '@/components/store/ExitIntentPopup'
import { CompareModal } from '@/components/store/CompareModal'
import { CompareTray } from '@/components/store/CompareTray'
import { RewardsSection } from '@/components/store/RewardsSection'
import { FlashSaleBanner } from '@/components/store/FlashSaleBanner'
import { GiftFinder } from '@/components/store/GiftFinder'
import { BundleConfigurator } from '@/components/store/BundleConfigurator'
import { OrderTrackingModal } from '@/components/store/OrderTrackingModal'
import { useCart, useWishlist, useUI } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'
import type { Product, Category } from '@/lib/types'

export default function Home() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showTop, setShowTop] = useState(false)

  const { count, openCart } = useCart()
  const wishlist = useWishlist()

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

    // Load shared wishlist from URL (?wishlist=<base64-ids>)
    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get('wishlist')
      if (shared) {
        const decoded = atob(shared)
        const ids = decoded.split(',').filter(Boolean)
        // Merge with existing wishlist
        const existing = wishlist.ids
        const merged = Array.from(new Set([...existing, ...ids]))
        // Set the wishlist (clear first then add each)
        merged.forEach((id) => {
          if (!wishlist.has(id)) wishlist.toggle(id)
        })
        // Show a toast and open wishlist
        setTimeout(() => {
          import('sonner').then(({ toast }) => {
            toast.success(t('page.sharedWishlistLoaded', ids.length.toString()), {
              description: t('page.sharedWishlistDesc'),
            })
          })
          useUI.getState().setWishlistOpen(true)
        }, 800)
        // Clean the URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch {
      // ignore decode errors
    }

    const onScroll = () => setShowTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const featured = products.filter((p) => p.isFeatured).slice(0, 4)
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4)
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <Hero />
        <FlashSaleBanner />
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

        <BundleConfigurator />

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

        <RecentlyViewed allProducts={products} />

        <GiftFinder />

        <AboutSection />
        <CraftsmanshipTimeline />
        <Testimonials />
        <RewardsSection />
        <Newsletter />
      </main>

      <Footer />

      {/* Overlays */}
      <ProductModal />
      <CartDrawer />
      <CheckoutDialog />
      <SearchDialog />
      <WishlistDrawer />
      <CompareModal />
      <OrderTrackingModal />
      <ConciergeChat />
      <ExitIntentPopup />
      <CompareTray />

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

        {/* Mobile cart FAB */}
        {count() > 0 && (
          <button
            onClick={openCart}
            className="sm:hidden h-14 px-5 rounded-full bg-gold text-navy-deep shadow-xl flex items-center gap-2 font-semibold text-sm"
          >
            <ShoppingBag className="h-5 w-5" />
            {t('page.viewBag', count().toString())}
          </button>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto mb-3" />
            <p className="font-display text-sm text-navy">{t('page.loading')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
