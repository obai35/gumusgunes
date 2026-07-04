import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ProductsPageClient from './ProductsPageClient'
import type { Metadata } from 'next'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "All Collections",
    description: "Explore our handcrafted stainless steel accessories — rings, necklaces, earrings, bracelets, and pendants.",
    openGraph: {
      title: "All Collections — Gümüş Güneş",
      description: "Explore our handcrafted stainless steel accessories.",
    },
  }
}

export default async function ProductsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const [categoriesRes, productsRes] = await Promise.all([
    fetch(`${baseUrl}/api/categories`, { cache: 'no-store' }).catch(() => null),
    fetch(`${baseUrl}/api/products?limit=100`, { cache: 'no-store' }).catch(() => null),
  ])

  const categoriesData = categoriesRes?.ok ? await categoriesRes.json() : { categories: [] }
  const categories = categoriesData.categories || []

  const productsData = productsRes?.ok ? await productsRes.json() : { products: [] }
  const initialProducts = productsData.products || []

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium">Products</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-display font-semibold text-navy mb-8">Our Collection</h1>
          <ProductsPageClient categories={categories} initialProducts={initialProducts} />
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>)
}
