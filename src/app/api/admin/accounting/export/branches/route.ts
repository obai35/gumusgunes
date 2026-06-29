import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const period = sp.get('period') || 'day'
    const now = new Date()
    let from: Date
    if (period === 'week') {
      from = new Date(now)
      from.setDate(from.getDate() - from.getDay())
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      from = new Date(now)
      from.setHours(0, 0, 0, 0)
    }

    const branches = await prisma.branch.findMany({
      include: {
        shifts: {
          where: { startedAt: { gte: from } },
          include: { orders: { select: { totalAmount: true, paymentMethod: true, cashAmount: true, cardAmount: true, status: true } } },
        },
      },
    })

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Branches')
    ws.columns = [
      { header: 'Branch', key: 'name', width: 20 },
      { header: 'Revenue', key: 'totalRevenue', width: 14 },
      { header: 'Orders', key: 'orderCount', width: 12 },
      { header: 'Cash', key: 'cashTotal', width: 14 },
      { header: 'Card', key: 'cardTotal', width: 14 },
      { header: 'Bank Transfer', key: 'bankTotal', width: 14 },
      { header: 'InstaPay', key: 'instapayTotal', width: 14 },
      { header: 'Wallet', key: 'walletTotal', width: 14 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D2D50' } }
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    branches.forEach((branch) => {
      const orders = branch.shifts.flatMap((s: any) => s.orders).filter((o: any) => o.status !== 'cancelled')
      const revenue = orders.reduce((s: number, o: any) => s + o.totalAmount, 0)
      ws.addRow({
        name: branch.name,
        totalRevenue: revenue,
        orderCount: orders.length,
        cashTotal: orders.reduce((s: number, o: any) => s + (o.cashAmount || (o.paymentMethod === 'cash' ? o.totalAmount : 0)), 0),
        cardTotal: orders.reduce((s: number, o: any) => s + (o.cardAmount || (o.paymentMethod === 'card' ? o.totalAmount : 0)), 0),
        bankTotal: orders.filter((o: any) => o.paymentMethod === 'bank_transfer').reduce((s: number, o: any) => s + o.totalAmount, 0),
        instapayTotal: orders.filter((o: any) => o.paymentMethod === 'instapay').reduce((s: number, o: any) => s + o.totalAmount, 0),
        walletTotal: orders.filter((o: any) => o.paymentMethod === 'wallet').reduce((s: number, o: any) => s + o.totalAmount, 0),
      })
    })

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="branches-${period}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export branch data' }, { status: 500 })
  }
}
