import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
prisma.governorate.count().then(c => { console.log(`Governorate count: ${c}`); prisma.$disconnect() })
