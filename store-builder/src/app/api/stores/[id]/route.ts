import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const store = await prisma.store.findUnique({
    where: { id: params.id },
    include: { deployments: { orderBy: { createdAt: 'desc' } } },
  })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    store: {
      ...store,
      features: JSON.parse(store.features || '[]'),
      theme: {
        primaryColor: store.primaryColor,
        secondaryColor: store.secondaryColor,
        accentColor: store.accentColor,
        borderRadius: store.borderRadius,
        fontFamily: store.fontFamily,
        logoUrl: store.logoUrl,
        faviconUrl: store.faviconUrl,
        layoutType: (store as any).layoutType || 'multi-page',
      },
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  const updateData: Record<string, any> = {}
  if (body.name) updateData.name = body.name
  if (body.status) updateData.status = body.status
  if (body.plan) updateData.plan = body.plan
  if (body.isDemo !== undefined) updateData.isDemo = body.isDemo
  if (body.clientName !== undefined) updateData.clientName = body.clientName
  if (body.clientEmail !== undefined) updateData.clientEmail = body.clientEmail
  if (body.notes !== undefined) updateData.notes = body.notes
  if (body.features) updateData.features = JSON.stringify(body.features)
  if (body.primaryColor) updateData.primaryColor = body.primaryColor
  if (body.secondaryColor) updateData.secondaryColor = body.secondaryColor
  if (body.accentColor) updateData.accentColor = body.accentColor
  if (body.borderRadius) updateData.borderRadius = body.borderRadius
  if (body.fontFamily) updateData.fontFamily = body.fontFamily
  if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl
  if (body.layoutType) (updateData as any).layoutType = body.layoutType

  const store = await prisma.store.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json({ ok: true, store })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.store.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}