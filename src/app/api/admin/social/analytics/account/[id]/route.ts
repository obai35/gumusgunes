import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req: NextRequest, { admin, params }: { admin: any; params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const account = await sdb.socialAccount.findFirst({ where: { id } })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const posts = await sdb.socialPost.findMany({
    where: { accountId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, postType: true, status: true, caption: true, publishedAt: true, performance: true },
  })

  return NextResponse.json({ account, posts })
}, 'social')
