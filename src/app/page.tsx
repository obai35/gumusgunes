import { db } from '@/lib/db'
import HomeClient from './HomeClient'
import type { Category, Product } from '@/lib/types'

export const revalidate = 60

export default async function Home() {
  const [categories, products] = await Promise.all([
    db.category.findMany({
      where: { isVisible: true },
      select: {
        id: true, name: true, slug: true, imageUrl: true, icon: true,
        parentId: true, description: true,
      },
    }),
    db.product.findMany({
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
    }),
  ])

  return <HomeClient categories={categories as Category[]} products={products as Product[]} />
}
