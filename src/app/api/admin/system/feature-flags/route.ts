import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { clearFeatureFlagCache } from '@/lib/feature-flags'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const singleKey = searchParams.get('key')

  if (singleKey) {
    const flag = await db.featureFlag.findUnique({ where: { key: singleKey } })
    return NextResponse.json({ enabled: flag?.enabled ?? false })
  }

  const flags = await db.featureFlag.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ flags })
}, 'system')

export const POST = withAdmin(async (req: Request) => {
  try {
    const { key, name, enabled, description } = await req.json()
    if (!key || !name) {
      return NextResponse.json({ error: 'key and name are required' }, { status: 400 })
    }
    const flag = await db.featureFlag.create({
      data: {
        key: key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        name,
        enabled: !!enabled,
        description: description || null,
      },
    })
    clearFeatureFlagCache(flag.key)
    return NextResponse.json({ flag })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'A feature flag with this key already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: err?.message || 'Failed to create' }, { status: 500 })
  }
}, 'system')
