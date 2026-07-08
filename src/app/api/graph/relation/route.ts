import { NextRequest, NextResponse } from 'next/server'
import { addRelation, removeRelation } from '@/lib/product-graph'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fromId, toId, type, weight, metadata } = body

  if (!fromId || !toId || !type) {
    return NextResponse.json({ error: 'fromId, toId, and type are required' }, { status: 400 })
  }

  const relation = await addRelation(fromId, toId, type, weight, metadata)
  return NextResponse.json(relation)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  await removeRelation(id)
  return NextResponse.json({ success: true })
}
