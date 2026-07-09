'use client'

import { motion } from 'framer-motion'

type GlowRevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function GlowReveal({ children, className, delay = 0 }: GlowRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, boxShadow: '0 0 0px rgba(212,175,55,0)' }}
      whileInView={{
        opacity: 1,
        y: 0,
        boxShadow: '0 0 40px -8px rgba(212,175,55,0.12)',
      }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
      viewport={{ once: true, margin: '-80px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
