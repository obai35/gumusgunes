'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-store'

const GOLD = '#C9A96E'

function CheckoutScene() {
  const [phase, setPhase] = useState<'enter' | 'reach' | 'present'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reach'), 600)
    const t2 = setTimeout(() => setPhase('present'), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <svg viewBox="0 0 400 280" className="w-80 h-56">
      {/* Checkout Counter */}
      <g>
        <rect x="240" y="170" width="100" height="35" rx="4" fill="none" stroke={GOLD} strokeWidth="3" />
        <rect x="280" y="155" width="20" height="15" rx="2" fill="none" stroke={GOLD} strokeWidth="2" />
        <rect x="250" y="145" width="25" height="20" rx="2" fill="none" stroke={GOLD} strokeWidth="1.5" />
        <rect x="325" y="160" width="8" height="25" rx="1" fill={GOLD} opacity="0.3" />
        <circle cx="260" cy="165" r="4" fill={GOLD} opacity="0.5" />
        <rect x="300" y="165" width="8" height="6" rx="1" fill={GOLD} opacity="0.5" />
      </g>

      {/* Figure */}
      <motion.g
        initial={{ x: -150, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <circle cx="60" cy="50" r="14" fill="#f0d5b0" />
        <path d="M46 45 Q60 25 74 45 Q70 40 60 38 Q50 40 46 45Z" fill="#3a2a1a" />
        <rect x="50" y="64" width="20" height="30" rx="4" fill="#1a202c" />
        <motion.g
          animate={phase === 'reach' ? { rotate: -20 } : phase === 'present' ? { rotate: 0 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ originX: '55px', originY: '66px' }}
        >
          <rect x="30" y="64" width="20" height="7" rx="3" fill="#f0d5b0" />
        </motion.g>
        <motion.g
          animate={phase === 'reach' ? { rotate: -25 } : phase === 'present' ? { rotate: 15 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ originX: '65px', originY: '66px' }}
        >
          <rect x="70" y="64" width="20" height="7" rx="3" fill="#f0d5b0" />
        </motion.g>
        <rect x="53" y="94" width="8" height="18" rx="3" fill="#2d3748" />
        <rect x="63" y="94" width="8" height="18" rx="3" fill="#2d3748" />
      </motion.g>

      {/* Sparkle Item */}
      {phase === 'reach' && (
        <motion.g
          initial={{ opacity: 0, scale: 0, x: 120, y: 30 }}
          animate={{ opacity: 1, scale: 1.2, x: 130, y: 50 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <polygon points="0,-10 4,-3 12,-3 6,3 8,12 0,7 -8,12 -6,3 -12,-3 -4,-3" fill={GOLD} />
        </motion.g>
      )}
      {phase === 'present' && (
        <motion.g
          initial={{ opacity: 1, scale: 1.2, x: 130, y: 50 }}
          animate={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
        >
          <polygon points="0,-10 4,-3 12,-3 6,3 8,12 0,7 -8,12 -6,3 -12,-3 -4,-3" fill={GOLD} />
        </motion.g>
      )}
    </svg>
  )
}

function CheckoutSceneFemale() {
  const [phase, setPhase] = useState<'enter' | 'reach' | 'present'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reach'), 600)
    const t2 = setTimeout(() => setPhase('present'), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <svg viewBox="0 0 400 280" className="w-80 h-56">
      <g>
        <rect x="240" y="170" width="100" height="35" rx="4" fill="none" stroke={GOLD} strokeWidth="3" />
        <rect x="280" y="155" width="20" height="15" rx="2" fill="none" stroke={GOLD} strokeWidth="2" />
        <rect x="250" y="145" width="25" height="20" rx="2" fill="none" stroke={GOLD} strokeWidth="1.5" />
        <rect x="325" y="160" width="8" height="25" rx="1" fill={GOLD} opacity="0.3" />
        <circle cx="260" cy="165" r="4" fill={GOLD} opacity="0.5" />
        <rect x="300" y="165" width="8" height="6" rx="1" fill={GOLD} opacity="0.5" />
      </g>

      <motion.g
        initial={{ x: -150, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <circle cx="60" cy="50" r="13" fill="#f5dcc3" />
        <path d="M47 45 Q60 28 73 45 Q69 38 60 36 Q51 38 47 45Z" fill="#5c3a1e" />
        <path d="M47 45 Q45 58 47 72" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M73 45 Q75 58 73 72" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M48 64 L72 64 L76 98 L44 98Z" fill="#c53030" />
        <motion.g
          animate={phase === 'reach' ? { rotate: -20 } : phase === 'present' ? { rotate: 0 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ originX: '55px', originY: '66px' }}
        >
          <rect x="32" y="64" width="18" height="6" rx="3" fill="#f5dcc3" />
        </motion.g>
        <motion.g
          animate={phase === 'reach' ? { rotate: -25 } : phase === 'present' ? { rotate: 15 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ originX: '65px', originY: '66px' }}
        >
          <rect x="70" y="64" width="18" height="6" rx="3" fill="#f5dcc3" />
        </motion.g>
        <rect x="53" y="96" width="7" height="16" rx="2" fill="#f5dcc3" />
        <rect x="62" y="96" width="7" height="16" rx="2" fill="#f5dcc3" />
      </motion.g>

      {phase === 'reach' && (
        <motion.g
          initial={{ opacity: 0, scale: 0, x: 120, y: 30 }}
          animate={{ opacity: 1, scale: 1.2, x: 130, y: 50 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <polygon points="0,-10 4,-3 12,-3 6,3 8,12 0,7 -8,12 -6,3 -12,-3 -4,-3" fill={GOLD} />
        </motion.g>
      )}
      {phase === 'present' && (
        <motion.g
          initial={{ opacity: 1, scale: 1.2, x: 130, y: 50 }}
          animate={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
        >
          <polygon points="0,-10 4,-3 12,-3 6,3 8,12 0,7 -8,12 -6,3 -12,-3 -4,-3" fill={GOLD} />
        </motion.g>
      )}
    </svg>
  )
}

export function CheckoutLoadingScreen() {
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
          {gender === 'FEMALE' || showFemale ? <CheckoutSceneFemale /> : <CheckoutScene />}
          <p className="font-display text-sm text-gold tracking-wider uppercase animate-pulse">
            Processing your order...
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
