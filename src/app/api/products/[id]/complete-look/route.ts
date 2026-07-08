import { NextRequest, NextResponse } from 'next/server'
import { getCompleteLook } from '@/lib/product-graph'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const limit = parseInt(new URL(_req.url).searchParams.get('limit') || '4', 10)

  const products = await getCompleteLook(id, limit)
  return NextResponse.json(products)
}
