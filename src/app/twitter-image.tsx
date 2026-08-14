import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'

export const alt = 'Gümüş Güneş — Handcrafted premium stainless steel accessories'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function brandLogo(): string | null {
  try {
    const buf = readFileSync(process.cwd() + '/public/gumusgunes-logo.jpeg')
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export default function TwitterImage() {
  const logo = brandLogo()
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
        {logo ? (
          <img
            src={logo}
            width={140}
            height={140}
            style={{ borderRadius: 24, marginBottom: 32, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '4px solid #C9A96E',
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C9A96E',
              fontSize: 44,
            }}
          >
            ✦
          </div>
        )}
        <div style={{ display: 'flex', color: '#FAF6EF', fontSize: 88, fontWeight: 700, letterSpacing: 4 }}>
          GÜMÜŞ GÜNEŞ
        </div>
        <div style={{ display: 'flex', color: '#C9A96E', fontSize: 40, letterSpacing: 8, marginTop: 16, fontWeight: 500 }}>
          SILVER SUN
        </div>
        <div style={{ display: 'flex', color: '#9fb0c3', fontSize: 28, marginTop: 40, textAlign: 'center' }}>
          Handcrafted premium stainless steel accessories
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