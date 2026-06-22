'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Sparkles, Check } from 'lucide-react'
import { useUI } from '@/lib/store'

const STORAGE_KEY = 'gg_exit_popup_shown'

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { searchOpen, wishlistOpen, checkoutOpen, productModalId } = useUI()

  useEffect(() => {
    // Only show once per session (per 7 days)
    const lastShown = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (lastShown) {
      const days = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24)
      if (days < 7) return
    }

    // Don't show if other modal is open
    const anyModalOpen = () => searchOpen || wishlistOpen || checkoutOpen || productModalId

    let timeout: ReturnType<typeof setTimeout>
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !anyModalOpen()) {
        timeout = setTimeout(() => {
          setOpen(true)
          localStorage.setItem(STORAGE_KEY, String(Date.now()))
        }, 100)
      }
    }
    document.addEventListener('mouseout', onMouseOut)
    return () => {
      document.removeEventListener('mouseout', onMouseOut)
      if (timeout) clearTimeout(timeout)
    }
  }, [searchOpen, wishlistOpen, checkoutOpen, productModalId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: 'Exit-intent signup' }),
      })
      const data = await res.json()
      if (data.ok) {
        setDone(true)
        setTimeout(() => {
          setOpen(false)
          setTimeout(() => {
            setDone(false)
            setEmail('')
          }, 400)
        }, 2200)
      } else {
        setDone(true) // still show success even if already subscribed
        setTimeout(() => setOpen(false), 2000)
      }
    } catch {
      setDone(true)
      setTimeout(() => setOpen(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-navy-deep/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-background rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4 text-navy" />
            </button>

            {/* Top navy section */}
            <div className="navy-radial text-silver p-8 text-center relative overflow-hidden">
              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ top: `${10 + (i * 15) % 80}%`, left: `${5 + (i * 17) % 90}%` }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                >
                  <Sparkles className="h-3 w-3 text-gold/60" />
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="h-16 w-16 mx-auto rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mb-4"
              >
                <Gift className="h-8 w-8 text-gold" />
              </motion.div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold-soft mb-2">Wait — a gift for you</p>
              <h2 className="font-display text-3xl font-semibold mb-1">
                <span className="silver-text">15% Off</span>
                <br />
                <span className="gold-text">Your First Piece</span>
              </h2>
            </div>

            {/* Body */}
            <div className="p-6">
              {done ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6"
                >
                  <div className="h-14 w-14 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mx-auto mb-3">
                    <Check className="h-7 w-7 text-gold" />
                  </div>
                  <p className="font-display text-xl font-semibold text-navy mb-1">Welcome to the family!</p>
                  <p className="text-sm text-muted-foreground">
                    Check your inbox — your 15% code is on its way. ✨
                  </p>
                </motion.div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-center mb-5 leading-relaxed">
                    Before you go — let us treat you. Sign up and receive{' '}
                    <strong className="text-navy">15% off</strong> your first order,
                    plus early access to new collections.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      className="w-full h-12 rounded-full bg-secondary/60 border border-border px-5 text-sm text-navy placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-gold/50"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-full bg-gold text-navy-deep font-semibold tracking-wide hover:bg-gold-soft transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="h-4 w-4 rounded-full border-2 border-navy-deep border-t-transparent animate-spin" />
                      ) : (
                        <>Claim My 15% Off</>
                      )}
                    </button>
                  </form>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full text-center text-xs text-muted-foreground hover:text-navy transition-colors mt-3"
                  >
                    No thanks, I&apos;ll pay full price
                  </button>
                  <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
                    By signing up you agree to receive marketing emails. Unsubscribe anytime.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
