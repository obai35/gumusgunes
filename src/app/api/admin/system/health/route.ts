import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { version } from '@/../package.json'

export const GET = withAdmin(async () => {
  const start = Date.now()
  const checks: Record<string, any> = {}

  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    checks.database = { status: 'healthy', latency: Date.now() - dbStart }
  } catch (err: any) {
    checks.database = { status: 'unhealthy', error: err.message }
  }

  if (redis) {
    try {
      const redisStart = Date.now()
      await redis.ping()
      checks.redis = { status: 'healthy', latency: Date.now() - redisStart }
    } catch (err: any) {
      checks.redis = { status: 'unhealthy', error: err.message }
    }
  } else {
    checks.redis = { status: 'not_configured' }
  }

  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [totalLogs, errorLogs] = await Promise.all([
      db.activityLog.count({ where: { createdAt: { gte: last24h } } }),
      db.activityLog.count({
        where: { createdAt: { gte: last24h }, action: { in: ['error', 'delete'] } },
      }),
    ])
    checks.errorRate = {
      total: totalLogs,
      errors: errorLogs,
      rate: totalLogs > 0 ? ((errorLogs / totalLogs) * 100).toFixed(2) + '%' : '0%',
    }
  } catch {
    checks.errorRate = { status: 'unavailable' }
  }

  try {
    const pendingOrders = await db.order.count({ where: { status: 'pending' } })
    checks.queueDepth = { pendingOrders }
  } catch {
    checks.queueDepth = { status: 'unavailable' }
  }

  try {
    const result: any = await db.$queryRaw`SELECT count(*)::int as count FROM pg_stat_activity WHERE state = 'active'`
    checks.dbConnections = { active: result[0]?.count || 0 }
  } catch {
    checks.dbConnections = { status: 'unavailable' }
  }

  const uptimeHours = Math.floor(process.uptime() / 3600)
  const uptimeMinutes = Math.floor((process.uptime() % 3600) / 60)

  const overallLatency = Date.now() - start

  return NextResponse.json({
    status: Object.values(checks).every((c: any) => c.status === 'healthy' || c.status === 'not_configured') ? 'healthy' : 'degraded',
    uptime: `${uptimeHours}h ${uptimeMinutes}m`,
    latency: overallLatency,
    version: version || '1.0.0',
    timestamp: new Date().toISOString(),
    checks,
  })
}, 'system')
