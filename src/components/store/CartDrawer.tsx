'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'
import { CartContent } from './CartContent'

export function CartDrawer() {
  const { items, isOpen, closeCart } = useCart()
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70]"
        >
          <div className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm" onClick={closeCart} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gold" />
                <h2 className="font-display text-xl font-semibold text-navy">
                  {t('cart.title')}
                </h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <button
                onClick={closeCart}
                className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"
              >
                <X className="h-5 w-5 text-navy" />
              </button>
            </div>

            <CartContent />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
