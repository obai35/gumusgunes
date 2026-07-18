'use client'

import { useState, useEffect } from 'react'

interface Badge {
  id: string
  icon: string
  label: string
  desc: string
  active: boolean
}

const defaultBadges: Badge[] = [
  { id: '1', icon: '🔒', label: 'Secure Checkout', desc: 'SSL encrypted payment', active: true },
  { id: '2', icon: '🛡️', label: 'Warranty Covered', desc: 'On every piece', active: true },
  { id: '3', icon: '💰', label: 'Money-Back Guarantee', desc: '30-day returns', active: true },
  { id: '4', icon: '🚚', label: 'Free Shipping', desc: 'On orders over $50', active: true },
]

export function TrustBadges() {
  const [badges, setBadges] = useState<Badge[]>(defaultBadges)

  useEffect(() => {
    let parsed: Badge[] | null = null
    if (typeof window !== 'undefined') {
      const el = document.getElementById('__PREVIEW_DATA')
      if (el?.textContent) {
        try {
          const data = JSON.parse(el.textContent)
          if (data.trustBadges) parsed = JSON.parse(data.trustBadges)
        } catch {}
      }
    }
    if (parsed) {
      setBadges(parsed.filter(b => b.active))
      return
    }
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.settings?.trustBadges) {
          try {
            parsed = JSON.parse(data.settings.trustBadges)
            setBadges(parsed.filter(b => b.active))
          } catch {}
        }
      })
      .catch(() => {})
  }, [])

  if (badges.length === 0) return null

  return (
    <section data-editable="trust-badges" className="bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {badges.map((b) => (
            <div key={b.id} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left hover-glow">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-navy/5 border border-gold/20 flex items-center justify-center text-2xl">
                {b.icon}
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-navy mb-0.5">{b.label}</h3>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
