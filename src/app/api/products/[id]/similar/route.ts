import { NextRequest, NextResponse } from 'next/server'
import { getSemanticSimilar } from '@/lib/product-graph'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const limit = parseInt(new URL(_req.url).searchParams.get('limit') || '6', 10)

  const products = await getSemanticSimilar(id, limit)
  return NextResponse.json(products)
}
