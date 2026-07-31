import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { db } from '@/lib/db'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { RecentlyViewed } from '@/components/store/RecentlyViewed'
import type { Product } from '@/lib/types'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const metadata: Metadata = {
  title: 'Recently Viewed — Gümüş Güneş',
  description: 'Pick up where you left off — revisit the handcrafted silver pieces you recently viewed at Gümüş Güneş.',
}

export const revalidate = 60

export default async function RecentlyViewedPage() {
  let products: Product[] = []
  try {
    const rows = await db.product.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, slug: true, price: true, compareAtPrice: true,
        imageUrl: true, rating: true, reviewCount: true, stock: true,
        isNew: true, isBestseller: true, isFeatured: true, material: true,
        tags: true, categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    products = rows as Product[]
  } catch {
    // DB unreachable during build — render shell only
  }

  return (
    <>
      <Header />
      <main>
        <RecentlyViewed allProducts={products} />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <ConciergeChat />
      </Suspense>
    </>
  )
}
