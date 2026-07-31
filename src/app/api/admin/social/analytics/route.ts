import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const [totalPosts, publishedPosts, scheduledPosts, failedPosts, totalAccounts] = await Promise.all([
    sdb.socialPost.count(),
    sdb.socialPost.count({ where: { status: 'published' } }),
    sdb.socialPost.count({ where: { status: 'scheduled' } }),
    sdb.socialPost.count({ where: { status: 'failed' } }),
    sdb.socialAccount.count({ where: { isActive: true } }),
  ])

  const posts = await sdb.socialPost.findMany({
    where: { status: 'published', performance: { not: Prisma.JsonNull } },
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
}, 'social')
