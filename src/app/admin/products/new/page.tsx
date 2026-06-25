import { PrismaClient } from '@prisma/client'
import { ProductForm } from '../ProductForm'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function NewProduct() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Add Product</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
