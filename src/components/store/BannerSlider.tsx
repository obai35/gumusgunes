'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Banner = {
  id: string; title: string | null; imageUrl: string
  linkUrl: string | null; textOverlay: string | null
  sortOrder: number
}

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/content/banners')
      .then(r => r.json())
      .then(data => {
        const now = new Date()
        const active = (Array.isArray(data) ? data : [])
          .filter((b: any) => {
            if (!b.isActive) return false
            if (b.startDate && new Date(b.startDate) > now) return false
            if (b.endDate && new Date(b.endDate) < now) return false
            return true
          })
          .sort((a: Banner, b: Banner) => a.sortOrder - b.sortOrder)
        setBanners(active)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const next = useCallback(() => setCurrent(p => (p + 1) % banners.length), [banners.length])
  const prev = useCallback(() => setCurrent(p => (p - 1 + banners.length) % banners.length), [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [banners.length, next])

  if (loading || banners.length === 0) return null

  const banner = banners[current]

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-navy-deep">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img src={banner.imageUrl} alt={banner.title || ''} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </motion.div>
      </AnimatePresence>

      {banner.textOverlay && (
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 lg:p-16">
          <motion.div
            key={banner.id + '-text'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {banner.title && (
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-white mb-2">{banner.title}</h2>
            )}
            <p className="text-sm sm:text-base text-white/80 max-w-xl">{banner.textOverlay}</p>
            {banner.linkUrl && (
              <Link href={banner.linkUrl} className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gold text-navy-deep rounded-full text-sm font-semibold hover:bg-gold-soft transition-colors">
                Shop Now
              </Link>
            )}
          </motion.div>
        </div>
      )}

      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors backdrop-blur-sm">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors backdrop-blur-sm">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-gold' : 'w-2 bg-white/50 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
