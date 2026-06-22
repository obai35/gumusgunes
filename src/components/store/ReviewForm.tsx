'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Send, Loader2, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/format'

const RING_SIZES = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10']

export function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [form, setForm] = useState({ authorName: '', authorEmail: '', title: '', comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.authorName || !form.title || !form.comment) {
      toast.error('Please fill in your name, a title, and your comment.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, productId, rating }),
      })
      const data = await res.json()
      if (data.ok) {
        setDone(true)
        toast.success('Thank you! Your review has been published.')
        onSubmitted()
        setTimeout(() => {
          setDone(false)
          setOpen(false)
          setForm({ authorName: '', authorEmail: '', title: '', comment: '' })
          setRating(5)
        }, 1800)
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-3 py-2.5 rounded-full border border-navy/20 text-navy text-sm font-medium hover:bg-navy hover:text-silver hover:border-navy transition-colors inline-flex items-center justify-center gap-2"
      >
        Write a Review
      </button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 overflow-hidden"
      >
        <div className="p-4 rounded-xl bg-secondary/40 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-base font-semibold text-navy">Share your experience</h4>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-navy">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {done ? (
            <div className="py-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="h-14 w-14 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mx-auto mb-3"
              >
                <Check className="h-7 w-7 text-gold" />
              </motion.div>
              <p className="font-display text-lg text-navy">Thank you for your review!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Star rating */}
              <div>
                <label className="text-xs font-medium text-navy mb-1.5 block">Your Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHover(s)}
                      onMouseLeave={() => setHover(0)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-7 w-7 transition-colors',
                          s <= (hover || rating)
                            ? 'fill-gold text-gold'
                            : 'fill-muted text-muted'
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-navy">
                    {rating} {rating === 1 ? 'star' : 'stars'}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-navy">Name *</label>
                  <Input
                    value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                    placeholder="Your name"
                    className="rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-navy">Email (optional)</label>
                  <Input
                    type="email"
                    value={form.authorEmail}
                    onChange={(e) => setForm({ ...form, authorEmail: e.target.value })}
                    placeholder="you@example.com"
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-navy">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Summarize your experience"
                  className="rounded-lg"
                  maxLength={120}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-navy">Your Review *</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder="Tell us about the quality, fit, and how it makes you feel…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[90px] resize-none focus:outline-none focus:ring-2 focus:ring-gold"
                  maxLength={2000}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep font-semibold tracking-wide"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing…</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Publish Review</>
                )}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export function RingSizeSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (size: string) => void
}) {
  const [showGuide, setShowGuide] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-navy">Ring Size (US)</label>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-[11px] text-gold hover:underline"
        >
          Size guide
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {RING_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={cn(
              'h-9 min-w-9 px-2 rounded-lg border text-sm font-medium transition-colors',
              value === size
                ? 'bg-navy text-silver border-navy'
                : 'bg-background text-navy border-border hover:border-gold'
            )}
          >
            {size}
          </button>
        ))}
      </div>
      {showGuide && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1"
        >
          <p><strong className="text-navy">How to measure:</strong></p>
          <p>• Wrap a strip of paper around your finger, mark where it overlaps.</p>
          <p>• Measure the length in mm, then divide by 3.14 for diameter.</p>
          <p>• US 6 ≈ 16.5mm · US 7 ≈ 17.3mm · US 8 ≈ 18.2mm · US 9 ≈ 19.0mm</p>
          <p className="text-gold mt-1">Between sizes? Size up for comfort.</p>
        </motion.div>
      )}
    </div>
  )
}
