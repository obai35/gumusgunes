import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { ProductShelfPage } from '@/components/store/ProductShelfPage'
import type { Product } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Bestsellers — Gümüş Güneş',
  description: 'Shop the client favorites at Gümüş Güneş — the most loved handcrafted silver pieces, chosen by thousands of clients worldwide.',
}

export const revalidate = 60

export default async function BestsellersPage() {
  let products: Product[] = []
  try {
    const rows = await db.product.findMany({
      where: { isActive: true, isBestseller: true },
      select: {
        id: true, name: true, slug: true, price: true, compareAtPrice: true,
        imageUrl: true, rating: true, reviewCount: true, stock: true,
        isNew: true, isBestseller: true, isFeatured: true, material: true,
        tags: true, categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ reviewCount: 'desc' }, { rating: 'desc' }],
      take: 40,
    })
    products = rows as Product[]
  } catch {
    // DB unreachable during build — render shell only
  }

  return (
    <ProductShelfPage
      eyebrow="Client Favorites"
      title="Bestsellers"
      description="The pieces our clients love most — proven favourites worn and loved around the world."
      products={products}
    />
  )
}
