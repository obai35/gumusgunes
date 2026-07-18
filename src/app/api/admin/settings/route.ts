import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitize } from '@/lib/sanitize'
import { withAdmin } from '@/lib/admin-permissions'

const MAX_VALUE_LENGTH = 50000

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
  announcementText: 'Free Worldwide Shipping on Orders Over 250 EGP · 30-Day Returns',
  announcementTextMobile: 'Free Shipping Over 250 EGP',
  navCollections: 'Collections',
  navNewArrivals: 'New Arrivals',
  navBestsellers: 'Bestsellers',
  navGiftFinder: 'Gift Finder',
  navOurStory: 'Our Story',
  footerEmail: 'concierge@gumusgunes.com',
  footerPhone: '+90 212 000 00 00',
  footerAbout: 'Handcrafted premium stainless steel accessories, inspired by the sun and the moon. Each piece finished in our Istanbul atelier.',
  footerAddress: 'Grand Bazaar, Nuruosmaniye No. 42, Istanbul, Türkiye',
  footerInstagram: 'https://instagram.com/gumusgunes',
  footerFacebook: 'https://facebook.com/gumusgunes',
  footerTwitter: 'https://twitter.com/gumusgunes',
  footerYoutube: 'https://youtube.com/@gumusgunes',
  footerCopyright: 'Gümüş Güneş Jewellery Ltd. All rights reserved.',
  heroTitle: 'Silver That Tells Your Story',
  heroSubtitle: 'Handcrafted premium stainless steel accessories, inspired by the sun and the moon. Each piece finished in our Istanbul atelier.',
  heroDescription: 'Each piece finished in our Istanbul atelier.',
  promoLimitedTime: 'Limited Time',
  promoHeading1: 'The Summer',
  promoHeading2: 'Solstice Collection',
  promoDescription: 'Up to 25% off selected pieces that celebrate the longest days of the year. Each purchase arrives in our signature gift box.',
  loyaltyPointsRate: '100',
  receiptHeader: 'Gümüş Güneş',
  receiptFooter: 'Thank you for your purchase!',
  receiptShowLogo: 'true',
  receiptShowTax: 'true',
  receiptTaxId: '123-456-789',
  receiptPhone: '+90 212 000 00 00',
  receiptAddress: 'Grand Bazaar, Istanbul',
  receiptShowReturnPolicy: 'true',
  receiptReturnPolicyDays: '30',
  trustBadges: '[{"id":"1","icon":"🔒","label":"Secure Checkout","desc":"SSL encrypted payment","active":true},{"id":"2","icon":"🛡️","label":"Warranty Covered","desc":"On every piece","active":true},{"id":"3","icon":"💰","label":"Money-Back Guarantee","desc":"30-day returns","active":true},{"id":"4","icon":"🚚","label":"Free Shipping","desc":"On orders over $50","active":true}]',
  aboutTitle: 'From Our Atelier',
  aboutContent: 'Every Gümüş Güneş piece begins as an idea sketched in our Istanbul atelier, overlooking the waters of the Bosphorus.\n\nEvery piece we create is a conversation between two elements: the ancient brilliance of the moon and the modern artistry of Istanbul. Our master craftsmen have spent decades perfecting techniques passed down through generations within the Grand Bazaar.\n\nWe believe luxury should be intimate — a quiet kind of beauty that feels personal, not performative. From our atelier to your hands, each piece carries the warmth of the hands that shaped it.',
  aboutImageUrl: '/products/about-craft.jpg',
  aboutMission: '',
  aboutVision: '',
  aboutStats: '[]',
}

export const GET = withAdmin(async () => {
  try {
    const settings = await db.siteSetting.findMany()
    const map: Record<string, string> = { ...DEFAULTS }
    for (const s of settings) map[s.key] = s.value
    return NextResponse.json({ ok: true, settings: map })
  } catch (err) {
    console.error('GET /api/admin/settings error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const entries = Object.entries(body) as [string, string][]
    for (const [key, value] of entries) {
      if (!key || typeof key !== 'string' || key.length > 200) {
        return NextResponse.json({ error: `Invalid key "${key}"` }, { status: 400 })
      }
      if (typeof value !== 'string' || value.length > MAX_VALUE_LENGTH) {
        return NextResponse.json(
          { error: `Value for "${key}" exceeds ${MAX_VALUE_LENGTH} characters (${typeof value !== 'string' ? 'not a string' : value.length})` },
          { status: 400 }
        )
      }
      await db.siteSetting.upsert({
        where: { key },
        update: { value: sanitize(value) },
        create: { key, value: sanitize(value) },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/admin/settings error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')
