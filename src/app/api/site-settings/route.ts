import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
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
  announcementText: 'Free Worldwide Shipping on Orders Over 250 EGP · 30-Day Returns',
  announcementTextMobile: 'Free Shipping Over 250 EGP',
  announcementEnabled: 'true',
  announcementBg: '#0a1628',
  announcementTextColor: '#f5efe6',
  announcementDismissible: 'false',
  heroTitle: 'Silver That Tells Your Story',
  heroSubtitle: 'Handcrafted premium stainless steel accessories, inspired by the sun and the moon. Each piece finished in our Istanbul atelier.',
  heroDescription: 'Discover Gümüş Güneş — a collection of premium stainless steel accessories inspired by the eternal dance of the sun, moon, and stars.',
  heroCtaText: 'Explore the Collection',
  heroCtaLink: '/products',
  heroBackground: '',
  heroOverlay: '40',
  heroLayout: 'centered',
  promoLimitedTime: 'Limited Time',
  promoHeading1: 'The Summer',
  promoHeading2: 'Solstice Collection',
  promoDescription: 'Up to 25% off selected pieces that celebrate the longest days of the year. Each purchase arrives in our signature gift box.',
  promoEnabled: 'true',
  promoTitle: '',
  promoCtaText: 'Shop Now',
  promoCtaLink: '/products',
  promoBackground: '',
  promoBgColor: '#0a1628',
  promoTextColor: '#f5efe6',
  footerEmail: 'concierge@gumusgunes.com',
  footerPhone: '+90 212 000 00 00',
  footerAbout: 'Handcrafted premium stainless steel accessories, inspired by the sun and the moon.',
  footerAddress: 'Grand Bazaar, Nuruosmaniye No. 42, Istanbul, Türkiye',
  footerInstagram: 'https://instagram.com/gumusgunes',
  footerFacebook: 'https://facebook.com/gumusgunes',
  footerTwitter: 'https://twitter.com/gumusgunes',
  footerYoutube: 'https://youtube.com/@gumusgunes',
  footerCopyright: 'Gümüş Güneş Jewellery Ltd. All rights reserved.',
  navCollections: 'Collections',
  navNewArrivals: 'New Arrivals',
  navBestsellers: 'Bestsellers',
  navGiftFinder: 'Gift Finder',
  navOurStory: 'Our Story',
  borderRadius: '8',
  buttonStyle: 'solid',
  loyaltyPointsRate: '100',
  aboutTitle: 'From Our Atelier',
  aboutContent: 'Every Gümüş Güneş piece begins as an idea sketched in our Istanbul atelier, overlooking the waters of the Bosphorus.\n\nEvery piece we create is a conversation between two elements: the ancient brilliance of the moon and the modern artistry of Istanbul. Our master craftsmen have spent decades perfecting techniques passed down through generations within the Grand Bazaar.\n\nWe believe luxury should be intimate — a quiet kind of beauty that feels personal, not performative. From our atelier to your hands, each piece carries the warmth of the hands that shaped it.',
  aboutImageUrl: '/products/about-craft.jpg',
  aboutMission: '',
  aboutVision: '',
  aboutStats: '[]',
}

export async function GET(req: NextRequest) {
  const noCache = req.nextUrl.searchParams.has('nocache')
  try {
    const settings = await db.siteSetting.findMany()
    const map: Record<string, string> = { ...DEFAULTS }
    for (const s of settings) map[s.key] = s.value
    const headers: Record<string, string> = {}
    if (!noCache) {
      headers['Cache-Control'] = 'public, s-maxage=60, stale-while-revalidate=300'
    }
    return NextResponse.json({ ok: true, settings: map }, { headers })
  } catch {
    return NextResponse.json({ ok: true, settings: DEFAULTS })
  }
}
