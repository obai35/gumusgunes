import { NextRequest, NextResponse } from 'next/server'
import { GroqContentGenerator } from '@/lib/social/groq-content'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { product, postType, tone } = body

  if (!product?.name || !postType) {
    return NextResponse.json({ error: 'Missing required fields: product.name, postType' }, { status: 400 })
  }

  try {
    const generator = new GroqContentGenerator()
    const result = await generator.generatePost(product, postType, tone || 'luxury')
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
