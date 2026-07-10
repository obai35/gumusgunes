'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-store'

const GOLD = '#C9A96E'

function CartScene() {
  const [phase, setPhase] = useState<'enter' | 'reach' | 'place'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reach'), 600)
    const t2 = setTimeout(() => setPhase('place'), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <svg viewBox="0 0 400 280" className="w-80 h-56">
      {/* Shopping Cart */}
      <g>
        <rect x="250" y="160" width="70" height="50" rx="8" fill="none" stroke={GOLD} strokeWidth="3" />
        <line x1="250" y1="175" x2="320" y2="175" stroke={GOLD} strokeWidth="1.5" opacity="0.4" />
        <line x1="250" y1="190" x2="320" y2="190" stroke={GOLD} strokeWidth="1.5" opacity="0.4" />
        <path d="M260 160 Q260 140 285 140 Q310 140 310 160" fill="none" stroke={GOLD} strokeWidth="3" />
        <circle cx="265" cy="215" r="8" fill="none" stroke={GOLD} strokeWidth="2.5" />
        <circle cx="305" cy="215" r="8" fill="none" stroke={GOLD} strokeWidth="2.5" />
        <circle cx="270" cy="185" r="5" fill={GOLD} opacity="0.6" />
        <rect x="290" y="180" width="10" height="10" rx="2" fill={GOLD} opacity="0.6" />
      </g>

      {/* Figure */}
      <motion.g
        initial={{ x: -150, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Head */}
        <circle cx="60" cy="50" r="14" fill="#f0d5b0" />
        {/* Hair */}
        <path d="M46 45 Q60 25 74 45 Q70 40 60 38 Q50 40 46 45Z" fill="#3a2a1a" />
        {/* Torso */}
        <rect x="50" y="64" width="20" height="30" rx="4" fill="#1a202c" />
        {/* Left arm */}
        <motion.g
          animate={phase === 'reach' ? { rotate: -25 } : phase === 'place' ? { rotate: 35 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ originX: '55px', originY: '66px' }}
        >
          <rect x="30" y="64" width="20" height="7" rx="3" fill="#f0d5b0" />
        </motion.g>
        {/* Right arm */}
        <motion.g
          animate={phase === 'reach' ? { rotate: -25 } : phase === 'place' ? { rotate: 20 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ originX: '65px', originY: '66px' }}
        >
          <rect x="70" y="64" width="20" height="7" rx="3" fill="#f0d5b0" />
        </motion.g>
        {/* Legs */}
        <rect x="53" y="94" width="8" height="18" rx="3" fill="#2d3748" />
        <rect x="63" y="94" width="8" height="18" rx="3" fill="#2d3748" />
      </motion.g>

      {/* Sparkle Item */}
      {phase === 'reach' && (
        <motion.g
          initial={{ opacity: 0, scale: 0, x: 120, y: 40 }}
          animate={{ opacity: 1, scale: 1.2, x: 140, y: 70 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <polygon points="0,-10 4,-3 12,-3 6,3 8,12 0,7 -8,12 -6,3 -12,-3 -4,-3" fill={GOLD} />
        </motion.g>
      )}
      {phase === 'place' && (
        <motion.g
          initial={{ opacity: 1, scale: 1.2, x: 140, y: 70 }}
          animate={{ opacity: 0, scale: 0.3, x: 155, y: 100 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
        >
          <polygon points="0,-10 4,-3 12,-3 6,3 8,12 0,7 -8,12 -6,3 -12,-3 -4,-3" fill={GOLD} />
        </motion.g>
      )}
    </svg>
  )
}

function CartSceneFemale() {
  const [phase, setPhase] = useState<'enter' | 'reach' | 'place'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reach'), 600)
    const t2 = setTimeout(() => setPhase('place'), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <svg viewBox="0 0 400 280" className="w-80 h-56">
      {/* Shopping Cart */}
      <g>
        <rect x="250" y="160" width="70" height="50" rx="8" fill="none" stroke={GOLD} strokeWidth="3" />
        <line x1="250" y1="175" x2="320" y2="175" stroke={GOLD} strokeWidth="1.5" opacity="0.4" />
        <line x1="250" y1="190" x2="320" y2="190" stroke={GOLD} strokeWidth="1.5" opacity="0.4" />
        <path d="M260 160 Q260 140 285 140 Q310 140 310 160" fill="none" stroke={GOLD} strokeWidth="3" />
        <circle cx="265" cy="215" r="8" fill="none" stroke={GOLD} strokeWidth="2.5" />
        <circle cx="305" cy="215" r="8" fill="none" stroke={GOLD} strokeWidth="2.5" />
        <circle cx="270" cy="185" r="5" fill={GOLD} opacity="0.6" />
        <rect x="290" y="180" width="10" height="10" rx="2" fill={GOLD} opacity="0.6" />
      </g>

      {/* Female Figure */}
      <motion.g
        initial={{ x: -150, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Head */}
        <circle cx="60" cy="50" r="13" fill="#f5dcc3" />
        {/* Hair */}
        <path d="M47 45 Q60 28 73 45 Q69 38 60 36 Q51 38 47 45Z" fill="#5c3a1e" />
        <path d="M47 45 Q45 58 47 72" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M73 45 Q75 58 73 72" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Dress */}
        <path d="M48 64 L72 64 L76 98 L44 98Z" fill="#c53030" />
        {/* Left arm */}
        <motion.g
          animate={phase === 'reach' ? { rotate: -25 } : phase === 'place' ? { rotate: 35 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ originX: '55px', originY: '66px' }}
        >
          <rect x="32" y="64" width="18" height="6" rx="3" fill="#f5dcc3" />
        </motion.g>
        {/* Right arm */}
        <motion.g
          animate={phase === 'reach' ? { rotate: -25 } : phase === 'place' ? { rotate: 20 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ originX: '65px', originY: '66px' }}
        >
          <rect x="70" y="64" width="18" height="6" rx="3" fill="#f5dcc3" />
        </motion.g>
        {/* Legs */}
        <rect x="53" y="96" width="7" height="16" rx="2" fill="#f5dcc3" />
        <rect x="62" y="96" width="7" height="16" rx="2" fill="#f5dcc3" />
      </motion.g>

      {/* Sparkle Item */}
      {phase === 'reach' && (
        <motion.g
          initial={{ opacity: 0, scale: 0, x: 120, y: 40 }}
          animate={{ opacity: 1, scale: 1.2, x: 140, y: 70 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <polygon points="0,-10 4,-3 12,-3 6,3 8,12 0,7 -8,12 -6,3 -12,-3 -4,-3" fill={GOLD} />
        </motion.g>
      )}
      {phase === 'place' && (
        <motion.g
          initial={{ opacity: 1, scale: 1.2, x: 140, y: 70 }}
          animate={{ opacity: 0, scale: 0.3, x: 155, y: 100 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
        >
          <polygon points="0,-10 4,-3 12,-3 6,3 8,12 0,7 -8,12 -6,3 -12,-3 -4,-3" fill={GOLD} />
        </motion.g>
      )}
    </svg>
  )
}

export function CartLoadingScreen() {
  const { user } = useAuth()
  const gender = user?.gender
  const [showFemale, setShowFemale] = useState(false)

  useEffect(() => {
    if (!gender) {
      const timer = setTimeout(() => setShowFemale(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [gender])

  return (
    <div className="fixed inset-0 z-[100] bg-navy-deep flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={showFemale ? 'female' : 'male'}
          className="flex flex-col items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {gender === 'FEMALE' || showFemale ? <CartSceneFemale /> : <CartScene />}
          <p className="font-display text-sm text-gold tracking-wider uppercase animate-pulse">
            Adding to your bag...
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
