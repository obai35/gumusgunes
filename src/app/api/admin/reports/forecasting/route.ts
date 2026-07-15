import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 }
  const sumX = data.reduce((s, d) => s + d.x, 0)
  const sumY = data.reduce((s, d) => s + d.y, 0)
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0)
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0)
  const sumY2 = data.reduce((s, d) => s + d.y * d.y, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const ssRes = data.reduce((s, d) => {
    const pred = slope * d.x + intercept
    return s + (d.y - pred) ** 2
  }, 0)
  const ssTot = data.reduce((s, d) => s + (d.y - sumY / n) ** 2, 0)
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0

  return { slope, intercept, r2: Math.round(r2 * 1000) / 1000 }
}

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const forecastMonths = parseInt(sp.get('forecastMonths') || '6')
    const historyMonths = parseInt(sp.get('historyMonths') || '24')

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - historyMonths, 1)
    start.setHours(0, 0, 0, 0)

    const orders = await db.order.findMany({
      where: { createdAt: { gte: start }, status: { not: 'cancelled' } },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const monthlyMap: Record<string, number> = {}
    for (const o of orders) {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = (monthlyMap[key] || 0) + o.totalAmount
    }

    const history: { month: string; revenue: number; x: number; y: number }[] = []
    let x = 0
    for (let i = historyMonths; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const revenue = monthlyMap[key] || 0
      history.push({ month: key, revenue: Math.round(revenue * 100) / 100, x, y: revenue })
      x++
    }

    const regression = linearRegression(history.filter(h => h.y > 0).map(h => ({ x: h.x, y: h.y })))

    const forecast: { month: string; revenue: number }[] = []
    const lastX = history[history.length - 1]?.x || 0
    for (let i = 1; i <= forecastMonths; i++) {
      const fx = lastX + i
      const predicted = Math.max(0, regression.slope * fx + regression.intercept)
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      forecast.push({ month: key, revenue: Math.round(predicted * 100) / 100 })
    }

    const totalForecastRevenue = forecast.reduce((s, f) => s + f.revenue, 0)
    const totalHistoryRevenue = history.reduce((s, h) => s + h.revenue, 0)

    const avgHistoryRevenue = history.length > 0
      ? Math.round((totalHistoryRevenue / history.length) * 100) / 100
      : 0
    const avgForecastRevenue = forecastMonths > 0
      ? Math.round((totalForecastRevenue / forecastMonths) * 100) / 100
      : 0

    return NextResponse.json({
      history,
      forecast,
      regression: {
        slope: Math.round(regression.slope * 100) / 100,
        intercept: Math.round(regression.intercept * 100) / 100,
        r2: regression.r2,
        trend: regression.slope >= 0 ? 'up' : 'down',
      },
      summary: {
        totalHistoryRevenue: Math.round(totalHistoryRevenue * 100) / 100,
        totalForecastRevenue: Math.round(totalForecastRevenue * 100) / 100,
        avgHistoryRevenue,
        avgForecastRevenue,
        forecastMonths,
        historyMonths,
      },
    })
  } catch (e) {
    console.error('Forecasting error:', e)
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 })
  }
}, 'reports')
