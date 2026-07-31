import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { ProductShelfPage } from '@/components/store/ProductShelfPage'
import type { Product } from '@/lib/types'

export const metadata: Metadata = {
  title: 'New Arrivals — Gümüş Güneş',
  description: 'Discover the latest handcrafted silver pieces from Gümüş Güneş — newly arrived jewelry curated for the season.',
}

export const revalidate = 60

export default async function NewArrivalsPage() {
  let products: Product[] = []
  try {
    const rows = await db.product.findMany({
      where: { isActive: true, isNew: true },
      select: {
        id: true, name: true, slug: true, price: true, compareAtPrice: true,
        imageUrl: true, rating: true, reviewCount: true, stock: true,
        isNew: true, isBestseller: true, isFeatured: true, material: true,
        tags: true, categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    })
    products = rows as Product[]
  } catch {
    // DB unreachable during build — render shell only
  }

  return (
    <ProductShelfPage
      eyebrow="Just Arrived"
      title="New Arrivals"
      description="The latest handcrafted pieces from our Istanbul atelier — each one fresh from the silversmith's bench."
      products={products}
    />
  )
}
