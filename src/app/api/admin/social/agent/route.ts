import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { SocialMediaAgent } from '@/lib/social/ai-agent'

const agent = new SocialMediaAgent()

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { action, ...params } = await req.json()

    if (!action) {
      return NextResponse.json({ ok: false, error: 'Action is required' }, { status: 400 })
    }

    let data: any

    switch (action) {
      case 'analyze-trends':
        data = await agent.analyzeTrends(params.niche || 'jewelry, accessories', params.region || 'egypt')
        break
      case 'suggest-videos':
        if (!params.product) throw new Error('Product details are required')
        data = await agent.suggestVideos(params.product, params.count || 3)
        break
      case 'recommend-ads':
        data = await agent.recommendAds(params.goal || 'sales', params.budget || 1000, params.target || 'women 18-45 Egypt')
        break
      case 'generate-insights':
        data = await agent.generateInsights(params.analytics || {})
        break
      case 'competitor-analysis':
        data = await agent.competitorAnalysis()
        break
      case 'content-strategy':
        data = await agent.contentStrategy(params.products || [], params.goals || 'increase engagement')
        break
      default:
        return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error('POST /api/admin/social/agent error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}, 'social')
