import { db } from '@/lib/db'
import { ProductForm } from '../ProductForm'

export const dynamic = 'force-dynamic'

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { name: 'asc' }, include: { parent: { select: { id: true, name: true } } } })
  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Add Product</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
