import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { GroqContentGenerator } from '@/lib/social/groq-content'

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const { action, product, products, postType, tone, region, niche, topic, count } = body

  try {
    const generator = new GroqContentGenerator()

    switch (action) {
      case 'post':
        if (!product?.name || !postType) {
          return NextResponse.json({ error: 'Missing required fields: product.name, postType' }, { status: 400 })
        }
        const post = await generator.generatePost(product, postType, tone || 'luxury')
        return NextResponse.json(post)

      case 'hashtags':
        const hashtags = await generator.generateHashtags(product, count || 10)
        return NextResponse.json({ hashtags })

      case 'trending': {
        const trends = await generator.generateTrendingHashtags(region || 'egypt', niche)
        return NextResponse.json(trends)
      }

      case 'analyze': {
        if (!topic) return NextResponse.json({ error: 'Missing topic' }, { status: 400 })
        const analysis = await generator.analyzeTrends(topic, region || 'egypt')
        return NextResponse.json(analysis)
      }

      case 'contentPlan': {
        if (!products || !Array.isArray(products)) {
          return NextResponse.json({ error: 'Missing products array' }, { status: 400 })
        }
        const plan = await generator.generateContentPlan(products, count || 5)
        return NextResponse.json(plan)
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
})
