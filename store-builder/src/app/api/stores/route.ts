import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, slug: true, status: true, plan: true,
      isDemo: true, clientName: true, createdAt: true,
    },
  })
  return NextResponse.json({ stores })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, clientName, clientEmail, plan, isDemo } = body

  const store = await prisma.store.create({
    data: {
      name,
      slug,
      clientName,
      clientEmail,
      plan: plan || 'starter',
      isDemo: isDemo || false,
      features: '["storefront","cart","checkout","userAccounts","banners","staticPages","discounts","basicAccounting","adminDashboard","productManagement","orderManagement","customerManagement","inventory","shipping","roleManagement","auditLogs","seo"]',
      status: isDemo ? 'demo' : 'draft',
    },
  })
  return NextResponse.json({ ok: true, store })
}