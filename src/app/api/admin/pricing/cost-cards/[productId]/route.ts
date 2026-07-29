import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { getCostCard, calculateSuggestedPrice } from '@/lib/cost-allocation'

export const GET = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { productId } = params
  const card = await getCostCard(productId, admin.storeId)
  if (!card) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json(card)
}, 'pricing')

export const POST = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { productId } = params
  const body = await req.json()
  const result = await calculateSuggestedPrice(productId, body.formulaId, admin.storeId)
  return NextResponse.json(result)
}, 'pricing')
