import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { redis } from '@/lib/redis'
import { revalidatePath } from 'next/cache'

export const POST = withAdmin(async (req: Request) => {
  const { action, key } = await req.json()
  const results: Record<string, any> = {}

  switch (action) {
    case 'clear-redis': {
      if (!redis) {
        results.redis = { error: 'Redis not configured' }
      } else {
        try {
          await redis.flushall()
          results.redis = { success: true }
        } catch (err: any) {
          results.redis = { error: err.message }
        }
      }
      break
    }
    case 'delete-redis-key': {
      if (!redis) {
        results.redis = { error: 'Redis not configured' }
      } else if (!key) {
        results.redis = { error: 'key is required' }
      } else {
        try {
          await redis.del(key)
          results.redis = { success: true, key }
        } catch (err: any) {
          results.redis = { error: err.message }
        }
      }
      break
    }
    case 'clear-isr': {
      try {
        revalidatePath('/', 'layout')
        results.isr = { success: true }
      } catch (err: any) {
        results.isr = { error: err.message }
      }
      break
    }
    case 'clear-cdn': {
      const cdnUrl = process.env.CDN_PURGE_URL
      if (!cdnUrl) {
        results.cdn = { error: 'CDN_PURGE_URL not configured' }
      } else {
        try {
          const res = await fetch(cdnUrl, { method: 'POST' })
          results.cdn = { success: res.ok, status: res.status }
        } catch (err: any) {
          results.cdn = { error: err.message }
        }
      }
      break
    }
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  return NextResponse.json({ results })
}, 'system')
