import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const updated = await db.product.updateMany({
  where: { slug: 'silver-locket-pendant' },
  data: { stock: 0 },
})
console.log('Updated', updated.count, 'product(s) to stock=0')
await db.$disconnect()
