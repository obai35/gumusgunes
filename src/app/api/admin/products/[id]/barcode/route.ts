import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import bwipjs from 'bwip-js'

export const GET = withAdmin(async (_req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const product = await sdb.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const numericId = id.replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
  const barcodeText = numericId

  try {
    const png = await bwipjs.toBuffer({
      bcid: 'ean13',
      text: barcodeText,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    })

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${product.sku}-barcode.png"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Barcode generation failed' }, { status: 500 })
  }
}, 'products')
