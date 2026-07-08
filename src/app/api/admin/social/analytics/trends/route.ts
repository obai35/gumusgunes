import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  const days = parseInt(searchParams.get('days') || '30')

  const posts = await db.socialPost.findMany({
    where: { ...(accountId ? { accountId } : {}), status: 'published' },
    select: { publishedAt: true, performance: true },
    orderBy: { publishedAt: 'asc' },
  })

  const trendMap = new Map<string, { reach: number; engagement: number; count: number }>()
  for (const p of posts) {
    if (!p.publishedAt || !p.performance) continue
    const date = p.publishedAt.toISOString().split('T')[0]
    const perf = p.performance as any
    const existing = trendMap.get(date) || { reach: 0, engagement: 0, count: 0 }
    existing.reach += perf.reach || 0
    existing.engagement += (perf.likes || 0) + (perf.comments || 0) + (perf.shares || 0)
    existing.count++
    trendMap.set(date, existing)
  }

  const trends = Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      reach: data.reach,
      engagement: data.engagement,
      posts: data.count,
    }))
    .slice(-days)

  return NextResponse.json({ trends })
}
