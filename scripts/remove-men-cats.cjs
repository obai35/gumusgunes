const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
;(async () => {
  await p.category.deleteMany({ where: { slug: { in: ['men-rings', 'men-bracelets'] } } })
  console.log('Deleted men-rings and men-bracelets')
  await p.$disconnect()
})()
