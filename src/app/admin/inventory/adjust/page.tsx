import { PrismaClient } from '@prisma/client'
import { AdjustForm } from './AdjustForm'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdjustStockPage() {
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, sku: true, stock: true } })
  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Adjust Stock</h1>
      <AdjustForm products={products} />
    </div>
  )
}
