import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULTS: Record<string, string> = {
  siteName: 'Gümüş Güneş',
  siteTagline: 'Silver Sun — Handcrafted in Istanbul',
  logoUrl: '/gumusgunes-logo.jpeg',
  primaryFont: "'Inter', sans-serif",
  headingFont: "'Playfair Display', serif",
  primaryColor: '#0a1628',
  accentColor: '#c9a84c',
  bgColor: '#ffffff',
  textColor: '#1a1a2e',
  announcementText: 'Free Worldwide Shipping on Orders Over $250 · 30-Day Returns · Lifetime Warranty',
  announcementTextMobile: 'Free Shipping Over $250 · Lifetime Warranty',
  heroTitle: 'Silver That Tells Your Story',
  heroSubtitle: 'Handcrafted 925 sterling silver jewelry, inspired by the sun and the moon. Each piece finished in our Istanbul atelier.',
  footerEmail: 'concierge@gumusgunes.com',
  footerPhone: '+90 212 000 00 00',
  footerAbout: 'Handcrafted 925 sterling silver jewelry, inspired by the sun and the moon.',
  footerAddress: 'Istanbul, Turkey',
}

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: Object.keys(DEFAULTS) } },
    })
    const map: Record<string, string> = { ...DEFAULTS }
    for (const s of settings) map[s.key] = s.value
    return NextResponse.json({ ok: true, settings: map })
  } catch {
    return NextResponse.json({ ok: true, settings: DEFAULTS })
  }
}
