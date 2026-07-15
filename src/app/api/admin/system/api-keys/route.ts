import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

function generateApiKey(): string {
  const prefix = 'gms'
  const random = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '')
  return `${prefix}_${random}`
}

export const GET = withAdmin(async () => {
  const keys = await db.apiKey.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    keys: keys.map(k => ({ ...k, key: k.key.slice(0, 12) + '...' })),
  })
}, 'system')

export const POST = withAdmin(async (req: Request) => {
  try {
    const { name, permissions } = await req.json()
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const rawKey = generateApiKey()
    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: rawKey,
        permissions: JSON.stringify(permissions || []),
      },
    })
    return NextResponse.json({ apiKey: { ...apiKey, rawKey } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create' }, { status: 500 })
  }
}, 'system')
