import { NextRequest, NextResponse } from 'next/server'
import { addRelation, removeRelation } from '@/lib/product-graph'
import { withAdmin } from '@/lib/admin-permissions'

async function handler(req: NextRequest) {
  if (req.method === 'POST') {
    const body = await req.json()
    const { fromId, toId, type, weight, metadata } = body

    if (!fromId || !toId || !type) {
      return NextResponse.json({ error: 'fromId, toId, and type are required' }, { status: 400 })
    }

    const relation = await addRelation(fromId, toId, type, weight, metadata)
    return NextResponse.json(relation)
  }

  if (req.method === 'DELETE') {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await removeRelation(id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export const POST = withAdmin(handler, 'graph')
export const DELETE = withAdmin(handler, 'graph')
