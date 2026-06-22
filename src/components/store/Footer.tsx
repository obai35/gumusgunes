'use client'

import { Sun, Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin, Package } from 'lucide-react'
import { useUI } from '@/lib/store'

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'Rings', href: '#collections' },
      { label: 'Necklaces', href: '#collections' },
      { label: 'Earrings', href: '#collections' },
      { label: 'Bracelets', href: '#collections' },
      { label: 'Pendants', href: '#collections' },
      { label: 'Gift Sets', href: '#collections' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '#about' },
      { label: 'Craftsmanship', href: '#about' },
      { label: 'Sustainability', href: '#about' },
      { label: 'Press', href: '#about' },
      { label: 'Careers', href: '#about' },
    ],
  },
  {
    title: 'Care',
    links: [
      { label: 'Shipping & Returns', href: '#' },
      { label: 'Lifetime Warranty', href: '#' },
      { label: 'Ring Sizing Guide', href: '#' },
      { label: 'Jewelry Care', href: '#' },
      { label: 'FAQs', href: '#' },
      { label: 'Contact Us', href: '#' },
    ],
  },
]

export function Footer() {
  const { setOrderTrackingOpen } = useUI()
  return (
    <footer className="bg-navy-deep text-silver mt-auto">
      {/* Top band */}
      <div className="border-b border-silver/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <a href="#top" className="flex items-center gap-3 mb-4">
                <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-gold/30">
                  <img
                    src="/gumusgunes-logo.jpeg"
                    alt="Gümüş Güneş"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-display text-2xl font-semibold">
                    Gümüş <span className="gold-text">Güneş</span>
                  </div>
                  <div className="text-[10px] tracking-[0.35em] uppercase text-silver/50 mt-0.5">
                    Silver Sun · Istanbul
                  </div>
                </div>
              </a>
              <p className="text-sm text-silver/60 leading-relaxed max-w-sm mb-5">
                Handcrafted 925 sterling silver jewelry, inspired by the sun, moon, and stars.
                Designed and finished in our atelier overlooking the Bosphorus.
              </p>

              <div className="space-y-2 text-sm text-silver/70">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gold flex-shrink-0" />
                  <a href="mailto:concierge@gumusgunes.com" className="hover:text-gold transition-colors">
                    concierge@gumusgunes.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gold flex-shrink-0" />
                  <span>+90 212 000 00 00</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                  <span>Grand Bazaar, Nuruosmaniye No. 42, Istanbul, Türkiye</span>
                </div>
              </div>

              {/* Social */}
              <div className="flex items-center gap-2 mt-6">
                {[
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Twitter, label: 'Twitter' },
                  { icon: Youtube, label: 'YouTube' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="h-10 w-10 rounded-full border border-silver/20 flex items-center justify-center text-silver/70 hover:border-gold hover:text-gold transition-colors"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-display text-base font-semibold text-gold mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-silver/60 hover:text-silver transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                  {col.title === 'Care' && (
                    <li>
                      <button
                        onClick={() => setOrderTrackingOpen(true)}
                        className="text-sm text-silver/60 hover:text-gold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Package className="h-3.5 w-3.5" />
                        Track Your Order
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment + trust */}
      <div className="border-b border-silver/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-silver/50 tracking-wide">
            <Sun className="h-3.5 w-3.5 text-gold" />
            <span>Certified 925 Sterling Silver · Conflict-Free Diamonds · Lifetime Warranty</span>
          </div>
          <div className="flex items-center gap-2">
            {['VISA', 'MC', 'AMEX', 'PAYPAL', 'APPLE PAY'].map((p) => (
              <div
                key={p}
                className="px-2.5 py-1 rounded-md bg-silver/10 border border-silver/20 text-[10px] font-semibold text-silver/70 tracking-wider"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-silver/40">
        <p>© {new Date().getFullYear()} Gümüş Güneş Jewellery Ltd. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-silver transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-silver transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-silver transition-colors">Cookie Settings</a>
        </div>
      </div>
    </footer>
  )
}
