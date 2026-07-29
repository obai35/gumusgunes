import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { PrismaClient } from '@prisma/client'
import { storeDb } from '@/lib/store-scoped'

const prisma = new PrismaClient()

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  if (!process.env.SEED_API_KEY) {
    return NextResponse.json(
      { error: 'Seed API is not configured' },
      { status: 503 }
    )
  }

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@gumusgunes.com'
  const password = process.env.ADMIN_SEED_PASSWORD
  if (!password) {
    return NextResponse.json({ error: 'ADMIN_SEED_PASSWORD environment variable must be set' }, { status: 500 })
  }
  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ message: 'Admin already exists' })
  const newAdmin = await prisma.admin.create({
    data: { email, name: 'Admin', password: await hashPassword(password), role: 'superadmin' },
  })
  return NextResponse.json({ message: 'Admin created', id: newAdmin.id })
}, 'seed')
