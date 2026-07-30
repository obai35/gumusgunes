import { NextRequest, NextResponse } from 'next/server'
import bwipjs from 'bwip-js'

export const GET = async (req: NextRequest) => {
  const text = req.nextUrl.searchParams.get('text')
  if (!text || text.length > 50) {
    return NextResponse.json({ error: 'Invalid text' }, { status: 400 })
  }

  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: 'center',
      backgroundcolor: 'ffffff',
    })

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Barcode generation failed' }, { status: 500 })
  }
}
