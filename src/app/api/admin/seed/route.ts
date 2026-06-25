import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth-utils'

const prisma = new PrismaClient()

export async function POST() {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@gumusgunes.com'
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin123'
  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ message: 'Admin already exists' })
  const admin = await prisma.admin.create({
    data: { email, name: 'Admin', password: await hashPassword(password), role: 'superadmin' },
  })
  return NextResponse.json({ message: 'Admin created', id: admin.id })
}
