import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { getApplicableTaxRate, calculateTax } from '@/lib/tax'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { country, region, subtotal, shipping } = await req.json()
    const tax = await getApplicableTaxRate(country || 'EG', region)
    if (!tax) return NextResponse.json({ ok: true, taxAmount: 0, taxName: null, taxRate: 0 })
    const taxAmount = calculateTax(subtotal || 0, shipping || 0, tax.rate)
    return NextResponse.json({ ok: true, taxAmount, taxName: tax.name, taxRate: tax.rate })
  } catch (err) {
    console.error('POST /api/admin/tax-rates/apply error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
})
