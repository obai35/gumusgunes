'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-store'

const GOLD = '#C9A96E'

const figureVariants = {
  hidden: { x: -200, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const armVariants = {
  hidden: { rotate: 0 },
  reach: {
    rotate: -30,
    transition: { duration: 0.5, delay: 0.7, ease: 'easeInOut' },
  },
  present: {
    rotate: 0,
    transition: { duration: 0.5, delay: 1.5, ease: 'easeInOut' },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0, x: 40 },
  float: {
    opacity: 1,
    scale: 1.2,
    x: 90,
    y: -10,
    transition: { duration: 0.6, delay: 1.0, ease: 'easeOut' },
  },
  done: {
    opacity: 0,
    transition: { duration: 0.3, delay: 2.0 },
  },
}

function MaleFigure() {
  return (
    <motion.g variants={figureVariants}>
      <circle cx="50" cy="40" r="14" fill="#f0d5b0" />
      <path d="M36 35 Q50 15 64 35 Q60 30 50 28 Q40 30 36 35Z" fill="#3a2a1a" />
      <path d="M40 54 L60 54 L55 85 L45 85Z" fill="#4a5568" />
      <motion.g variants={armVariants} style={{ originX: '45px', originY: '56px' }}>
        <rect x="26" y="54" width="18" height="7" rx="3" fill="#f0d5b0" transform="rotate(-15 35 57)" />
      </motion.g>
      <motion.g variants={armVariants} style={{ originX: '55px', originY: '56px' }}>
        <rect x="56" y="54" width="18" height="7" rx="3" fill="#f0d5b0" transform="rotate(15 65 57)" />
      </motion.g>
      <rect x="43" y="85" width="9" height="20" rx="3" fill="#2d3748" />
      <rect x="52" y="85" width="9" height="20" rx="3" fill="#2d3748" />
    </motion.g>
  )
}

function FemaleFigure() {
  return (
    <motion.g variants={figureVariants}>
      <circle cx="50" cy="40" r="13" fill="#f5dcc3" />
      <path d="M37 35 Q50 10 63 35 Q58 28 50 26 Q42 28 37 35Z" fill="#5c3a1e" />
      <path d="M37 35 Q35 50 37 65" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M63 35 Q65 50 63 65" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M38 54 L62 54 L66 90 L34 90Z" fill="#c53030" />
      <motion.g variants={armVariants} style={{ originX: '45px', originY: '56px' }}>
        <rect x="26" y="54" width="16" height="6" rx="3" fill="#f5dcc3" transform="rotate(-15 34 57)" />
      </motion.g>
      <motion.g variants={armVariants} style={{ originX: '55px', originY: '56px' }}>
        <rect x="58" y="54" width="16" height="6" rx="3" fill="#f5dcc3" transform="rotate(15 66 57)" />
      </motion.g>
      <rect x="44" y="88" width="7" height="17" rx="2" fill="#f5dcc3" />
      <rect x="53" y="88" width="7" height="17" rx="2" fill="#f5dcc3" />
    </motion.g>
  )
}

function CheckoutCounter() {
  return (
    <g>
      <rect x="240" y="170" width="100" height="35" rx="4" fill="none" stroke={GOLD} strokeWidth="3" />
      <rect x="280" y="155" width="20" height="15" rx="2" fill="none" stroke={GOLD} strokeWidth="2" />
      <rect x="250" y="145" width="25" height="20" rx="2" fill="none" stroke={GOLD} strokeWidth="1.5" />
      <rect x="325" y="160" width="8" height="25" rx="1" fill={GOLD} opacity="0.3" />
      <circle cx="260" cy="165" r="4" fill={GOLD} opacity="0.5" />
      <rect x="300" y="165" width="8" height="6" rx="1" fill={GOLD} opacity="0.5" />
    </g>
  )
}

function SparkleItem() {
  return (
    <motion.g variants={itemVariants}>
      <polygon points="0,-12 5,-3 14,-3 7,4 9,14 0,8 -9,14 -7,4 -14,-3 -5,-3" fill={GOLD} />
    </motion.g>
  )
}

export function CheckoutLoadingScreen() {
  const { user } = useAuth()
  const gender = user?.gender
  const [showFemale, setShowFemale] = useState(false)

  useEffect(() => {
    if (!gender) {
      const timer = setTimeout(() => setShowFemale(true), 1400)
      return () => clearTimeout(timer)
    }
  }, [gender])

  return (
    <div className="fixed inset-0 z-[100] bg-navy-deep flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <svg viewBox="0 0 400 280" className="w-80 h-56">
          {!showFemale && (
            <motion.g initial="hidden" animate="visible" exit={{ opacity: 0, transition: { duration: 0.3 } }}>
              <MaleFigure />
              <CheckoutCounter />
              <motion.g initial="hidden" animate={['float', 'done']} style={{ x: 50, y: 40 }}>
                <SparkleItem />
              </motion.g>
            </motion.g>
          )}
          {(gender === 'FEMALE' || showFemale) && (
            <motion.g initial="hidden" animate="visible">
              <FemaleFigure />
              <CheckoutCounter />
              <motion.g initial="hidden" animate={['float', 'done']} style={{ x: 50, y: 40 }}>
                <SparkleItem />
              </motion.g>
            </motion.g>
          )}
        </svg>
        <p className="font-display text-sm text-gold tracking-wider uppercase animate-pulse">
          Processing your order...
        </p>
      </div>
    </div>
  )
}
