import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  announcementText: 'Free Worldwide Shipping on Orders Over $250 · 30-Day Returns',
  announcementTextMobile: 'Free Shipping Over $250',
  navCollections: 'Collections',
  navNewArrivals: 'New Arrivals',
  navBestsellers: 'Bestsellers',
  navGiftFinder: 'Gift Finder',
  navOurStory: 'Our Story',
  footerEmail: 'concierge@gumusgunes.com',
  footerPhone: '+90 212 000 00 00',
  footerAbout: 'Handcrafted premium stainless steel accessories, inspired by the sun and the moon. Each piece finished in our Istanbul atelier.',
  footerAddress: 'Istanbul, Turkey',
  heroTitle: 'Silver That Tells Your Story',
  heroSubtitle: 'Handcrafted premium stainless steel accessories, inspired by the sun and the moon. Each piece finished in our Istanbul atelier.',
  promoLimitedTime: 'Limited Time',
  promoHeading1: 'The Summer',
  promoHeading2: 'Solstice Collection',
  promoDescription: 'Up to 25% off selected pieces that celebrate the longest days of the year. Each purchase arrives in our signature gift box.',
}

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany()
    const map: Record<string, string> = { ...DEFAULTS }
    for (const s of settings) map[s.key] = s.value
    return NextResponse.json({ ok: true, settings: map })
  } catch (err) {
    console.error('GET /api/admin/settings error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const entries = Object.entries(body) as [string, string][]
    for (const [key, value] of entries) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/admin/settings error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}
