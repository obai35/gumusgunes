import { NextRequest, NextResponse } from 'next/server'
import { getRelated } from '@/lib/product-graph'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(_req.url)
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '8', 10)

  const products = await getRelated({
    productId: id,
    types: type ? [type as any] : undefined,
    limit,
  })

  return NextResponse.json(products)
}
