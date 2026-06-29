'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useUI } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'
import { CheckoutContent } from './CheckoutContent'

export function CheckoutDialog() {
  const { checkoutOpen, setCheckoutOpen } = useUI()
  const { t } = useTranslation()

  const handleClose = () => {
    setCheckoutOpen(false)
  }

  return (
    <AnimatePresence>
      {checkoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
        >
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-display text-2xl font-semibold text-navy">
                  {t('checkout.title')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('checkout.step1')}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"
              >
                <X className="h-5 w-5 text-navy" />
              </button>
            </div>

            <CheckoutContent />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
