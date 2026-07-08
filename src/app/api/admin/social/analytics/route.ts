import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [totalPosts, publishedPosts, scheduledPosts, failedPosts, totalAccounts] = await Promise.all([
    db.socialPost.count(),
    db.socialPost.count({ where: { status: 'published' } }),
    db.socialPost.count({ where: { status: 'scheduled' } }),
    db.socialPost.count({ where: { status: 'failed' } }),
    db.socialAccount.count({ where: { isActive: true } }),
  ])

  const posts = await db.socialPost.findMany({
    where: { status: 'published', performance: { not: null } },
    select: { performance: true },
  })

  let totalLikes = 0, totalComments = 0, totalShares = 0, totalReach = 0
  for (const p of posts) {
    const perf = p.performance as any
    if (perf) {
      totalLikes += perf.likes || 0
      totalComments += perf.comments || 0
      totalShares += perf.shares || 0
      totalReach += perf.reach || 0
    }
  }

  return NextResponse.json({
    totalPosts,
    publishedPosts,
    scheduledPosts,
    failedPosts,
    totalAccounts,
    totalLikes,
    totalComments,
    totalShares,
    totalReach,
    engagementRate: totalReach > 0 ? ((totalLikes + totalComments + totalShares) / totalReach * 100).toFixed(2) : '0',
  })
}
