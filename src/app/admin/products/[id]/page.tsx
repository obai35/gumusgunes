import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import ProductDetailClient from './ProductDetailClient'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  })
  if (!product) notFound()

  const serialized = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    tags: (() => { try { return JSON.parse(product.tags) } catch { return [] } })(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }

  return <ProductDetailClient product={serialized} />
}
