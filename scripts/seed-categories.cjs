const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  // Delete dependent data first, then re-create categories
  await prisma.inventoryLog.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.backInStock.deleteMany()
  await prisma.review.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  const women = await prisma.category.create({ data: { name: 'Women', slug: 'women', icon: 'female', imageUrl: '/products/cat-women.jpg', description: 'Elegant sterling silver jewelry for women' } })
  const men = await prisma.category.create({ data: { name: 'Men', slug: 'men', icon: 'male', imageUrl: '/products/cat-men.jpg', description: 'Bold sterling silver accessories for men' } })
  const children = await prisma.category.create({ data: { name: 'Children', slug: 'children', icon: 'child', imageUrl: '/products/cat-children.jpg', description: 'Adorable silver jewelry for kids' } })
  const subs = [
    { p: women, items: [['Rings','women-rings','ring'],['Necklaces','women-necklaces','necklace'],['Earrings','women-earrings','earring'],['Bracelets','women-bracelets','bracelet'],['Pendants','women-pendants','pendant'],['Sets','women-sets','set'],['Watches','women-watches','watch'],['Belts','women-belts','belt'],['Bags','women-bags','bag']] },
    { p: men, items: [['Pendants','men-pendants','pendant'],['Watches','men-watches','watch'],['Belts','men-belts','belt'],['Bags','men-bags','bag']] },
    { p: children, items: [['Rings','children-rings','ring'],['Necklaces','children-necklaces','necklace'],['Earrings','children-earrings','earring'],['Bracelets','children-bracelets','bracelet'],['Pendants','children-pendants','pendant'],['Sets','children-sets','set'],['Watches','children-watches','watch'],['Belts','children-belts','belt'],['Bags','children-bags','bag']] },
  ]
  for (const { p, items } of subs) {
    for (const [name, slug, icon] of items) {
      await prisma.category.create({ data: { name, slug, icon, parentId: p.id } })
    }
  }
  console.log('Category hierarchy seeded successfully')
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
