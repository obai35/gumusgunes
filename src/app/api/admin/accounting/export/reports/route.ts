import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const type = sp.get('type') || 'daily'
    const fromParam = sp.get('from') || ''
    const toParam = sp.get('to') || ''

    const now = new Date()
    let from: Date
    let to: Date = new Date(now)
    to.setHours(23, 59, 59, 999)

    if (fromParam) {
      from = new Date(fromParam)
    } else if (type === 'weekly') {
      from = new Date(now)
      from.setDate(from.getDate() - 27)
      from.setHours(0, 0, 0, 0)
    } else if (type === 'monthly') {
      from = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    } else {
      from = new Date(now)
      from.setDate(from.getDate() - 6)
      from.setHours(0, 0, 0, 0)
    }
    if (toParam) to = new Date(toParam + 'T23:59:59.999Z')

    const orders = await db.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { not: 'cancelled' } },
      orderBy: { createdAt: 'asc' },
    })

    const grouped: Record<string, { revenue: number; count: number }> = {}
    for (const order of orders) {
      let key: string
      if (type === 'monthly') {
        key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      } else if (type === 'weekly') {
        const d = new Date(order.createdAt)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      } else {
        key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}-${String(order.createdAt.getDate()).padStart(2, '0')}`
      }
      if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 }
      grouped[key].revenue += order.totalAmount
      grouped[key].count++
    }

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Reports')
    ws.columns = [
      { header: 'Period', key: 'period', width: 18 },
      { header: 'Revenue', key: 'revenue', width: 14 },
      { header: 'Orders', key: 'orderCount', width: 12 },
      { header: 'Avg Order Value', key: 'avgOrderValue', width: 16 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D2D50' } }
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    const periods = Object.entries(grouped).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      orderCount: data.count,
      avgOrderValue: data.count > 0 ? data.revenue / data.count : 0,
    }))

    periods.forEach((p) => { ws.addRow(p) })
    ws.getColumn('revenue').numFmt = '#,##0.00'
    ws.getColumn('avgOrderValue').numFmt = '#,##0.00'

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reports-${type}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (e) {
    console.error('Export reports error:', e)
    return NextResponse.json({ error: 'Failed to export reports' }, { status: 500 })
  }
}, 'accounting')
