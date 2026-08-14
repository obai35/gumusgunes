import { ImageResponse } from 'next/og'
import { db } from '@/lib/db'

export const alt = 'Gümüş Güneş — Handcrafted premium stainless steel accessories'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function fallbackCard(name: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a1628',
          padding: 80,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #C9A96E, #E8D5A3, #C9A96E)',
          }}
        />
        <div style={{ display: 'flex', color: '#C9A96E', fontSize: 40, letterSpacing: 8, marginBottom: 32, fontWeight: 500 }}>
          GÜMÜŞ GÜNEŞ
        </div>
        <div
          style={{
            display: 'flex',
            color: '#FAF6EF',
            fontSize: 56,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.25,
            maxWidth: 1000,
          }}
        >
          {name}
        </div>
        <div style={{ display: 'flex', color: '#9fb0c3', fontSize: 28, marginTop: 40 }}>
          Handcrafted Stainless Steel Accessories
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #C9A96E, #E8D5A3, #C9A96E)',
          }}
        />
      </div>
    ),
    size,
  )
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    const product = await db.product.findFirst({
      where: { OR: [{ id }, { slug: id }], isActive: true },
      select: { name: true, imageUrl: true },
    })
    if (!product) return fallbackCard('Gümüş Güneş')

    let image: string | null = null
    if (product.imageUrl) {
      try {
        const res = await fetch(product.imageUrl, { signal: AbortSignal.timeout(8000) })
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer())
          image = `data:${res.headers.get('content-type') || 'image/jpeg'};base64,${buf.toString('base64')}`
        }
      } catch {
        image = null
      }
    }
    if (!image) return fallbackCard(product.name)

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: '#0a1628',
            padding: 80,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 8,
              background: 'linear-gradient(90deg, #C9A96E, #E8D5A3, #C9A96E)',
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: 48 }}>
            <div style={{ display: 'flex', color: '#C9A96E', fontSize: 28, letterSpacing: 6, marginBottom: 24, fontWeight: 500 }}>
              GÜMÜŞ GÜNEŞ
            </div>
            <div style={{ display: 'flex', color: '#FAF6EF', fontSize: 54, fontWeight: 700, lineHeight: 1.25 }}>
              {product.name}
            </div>
            <div style={{ display: 'flex', color: '#9fb0c3', fontSize: 26, marginTop: 32 }}>
              Handcrafted Stainless Steel Accessories
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={image}
              width={400}
              height={400}
              style={{ borderRadius: 32, objectFit: 'cover' }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 8,
              background: 'linear-gradient(90deg, #C9A96E, #E8D5A3, #C9A96E)',
            }}
          />
        </div>
      ),
      size,
    )
  } catch {
    return fallbackCard('Gümüş Güneş')
  }
}