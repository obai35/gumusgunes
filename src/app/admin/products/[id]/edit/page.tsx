import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ProductForm } from '../../ProductForm'
import StockHistory from '../StockHistory'

export const dynamic = 'force-dynamic'

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  const categories = await db.category.findMany({ orderBy: { name: 'asc' }, include: { parent: { select: { id: true, name: true } } } })
  if (!product) notFound()

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Edit {product.name}</h1>
      <ProductForm
        categories={categories}
        productId={product.id}
        initialData={{
          name: product.name, slug: product.slug, description: product.description,
          price: product.price, compareAtPrice: product.compareAtPrice || undefined,
          sku: product.sku, categoryId: product.categoryId, material: product.material,
          weight: product.weight || undefined, stock: product.stock, imageUrl: product.imageUrl,
          images: product.images, tags: product.tags, isActive: product.isActive,
          isFeatured: product.isFeatured, isNew: product.isNew, isBestseller: product.isBestseller,
        }}
      />
      <StockHistory productId={product.id} />
    </div>
  )
}
