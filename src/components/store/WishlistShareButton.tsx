'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Link as LinkIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWishlist } from '@/lib/store'
import { useHydrated } from '@/hooks/use-hydrated'
import { toast } from 'sonner'

export function WishlistShareButton() {
  const hydrated = useHydrated()
  const { ids } = useWishlist()
  const [copied, setCopied] = useState(false)
  const [showLink, setShowLink] = useState(false)

  if (!hydrated || ids.length === 0) return null

  const generateLink = () => {
    if (typeof window === 'undefined') return ''
    const encoded = btoa(ids.join(','))
    return `${window.location.origin}/?wishlist=${encoded}`
  }

  const handleShare = async () => {
    const url = generateLink()
    setShowLink(true)

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Gümüş Güneş Wishlist',
          text: `Check out my favorite pieces from Gümüş Güneş ✨`,
          url,
        })
        toast.success('Wishlist shared!')
        return
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Wishlist link copied to clipboard!', {
        description: 'Share it with anyone you love.',
      })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Could not copy link — please copy it manually.')
    }
  }

  const url = generateLink()

  return (
    <div className="p-4 border-t border-border bg-secondary/30">
      <button
        onClick={handleShare}
        className="w-full h-10 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share My Wishlist
      </button>

      <AnimatePresence>
        {showLink && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border">
              <LinkIcon className="h-3.5 w-3.5 text-gold flex-shrink-0 ml-1" />
              <input
                readOnly
                value={url}
                className="flex-1 text-xs text-navy bg-transparent outline-none truncate font-mono"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(url)
                  setCopied(true)
                  toast.success('Link copied!')
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="h-8 w-8 rounded-md bg-secondary hover:bg-gold hover:text-navy-deep flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Copy link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              {ids.length} {ids.length === 1 ? 'piece' : 'pieces'} in this wishlist · Link valid forever
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
