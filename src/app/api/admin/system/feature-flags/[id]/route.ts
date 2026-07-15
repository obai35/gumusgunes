import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { clearFeatureFlagCache } from '@/lib/feature-flags'
import { db } from '@/lib/db'

export const PUT = withAdmin(async (req: Request, { params }: { params: { id: string } }) => {
  const id = params.id
  const { name, enabled, description, key } = await req.json()
  const data: any = {}
  if (name !== undefined) data.name = name
  if (enabled !== undefined) data.enabled = enabled
  if (description !== undefined) data.description = description
  if (key !== undefined) data.key = key
  const flag = await db.featureFlag.update({ where: { id }, data })
  clearFeatureFlagCache(flag.key)
  return NextResponse.json({ flag })
}, 'system')

export const DELETE = withAdmin(async (_req: Request, { params }: { params: { id: string } }) => {
  const id = params.id
  const flag = await db.featureFlag.findUnique({ where: { id } })
  if (!flag) {
    return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
  }
  await db.featureFlag.delete({ where: { id } })
  clearFeatureFlagCache(flag.key)
  return NextResponse.json({ success: true })
}, 'system')
