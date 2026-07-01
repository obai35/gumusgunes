import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = sp.get('search') || ''
    const status = sp.get('status') || ''
    const paymentStatus = sp.get('paymentStatus') || ''
    const branchId = sp.get('branchId') || ''
    const from = sp.get('from') || ''
    const to = sp.get('to') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { receiptNumber: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (branchId) where.shift = { branchId }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59.999Z')
    }

    const orders = await db.order.findMany({
      where,
      include: {
        shift: { include: { branch: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Orders')
    ws.columns = [
      { header: 'Order #', key: 'orderNumber', width: 18 },
      { header: 'Receipt #', key: 'receiptNumber', width: 18 },
      { header: 'Customer', key: 'fullName', width: 22 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Total', key: 'totalAmount', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Payment', key: 'paymentMethod', width: 14 },
      { header: 'Payment Status', key: 'paymentStatus', width: 14 },
      { header: 'Fulfilled', key: 'fulfilledAt', width: 14 },
      { header: 'Reconciled', key: 'reconciledAt', width: 14 },
      { header: 'Date', key: 'createdAt', width: 18 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D2D50' } }
    headerRow.alignment = { horizontal: 'center' }
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    const paymentLabels: Record<string, string> = {
      cash: 'Cash', card: 'Card', split: 'Split',
      bank_transfer: 'Bank Transfer', instapay: 'InstaPay', wallet: 'Wallet',
    }

    orders.forEach((o) => {
      ws.addRow({
        orderNumber: o.orderNumber,
        receiptNumber: o.receiptNumber || '',
        fullName: o.fullName,
        branch: o.shift?.branch?.name || 'Online',
        totalAmount: o.totalAmount,
        status: o.status,
        paymentMethod: paymentLabels[o.paymentMethod] || o.paymentMethod,
        paymentStatus: o.paymentStatus,
        fulfilledAt: o.fulfilledAt ? new Date(o.fulfilledAt).toLocaleDateString() : '',
        reconciledAt: o.reconciledAt ? new Date(o.reconciledAt).toLocaleDateString() : '',
        createdAt: new Date(o.createdAt).toLocaleDateString(),
      })
    })

    ws.getColumn('totalAmount').numFmt = '#,##0.00'
    ws.getColumn('totalAmount').alignment = { horizontal: 'right' }

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (e) {
    console.error('Export orders error:', e)
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 })
  }
}
