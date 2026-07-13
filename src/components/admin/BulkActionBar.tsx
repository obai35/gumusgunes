'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

type BulkAction = {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline'
}

type BulkActionBarProps = {
  selectedCount: number
  actions: BulkAction[]
  onClear: () => void
}

export function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 bg-navy text-white px-5 py-3 rounded-full shadow-lg">
          <span className="text-sm font-medium whitespace-nowrap">{selectedCount} selected</span>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            {actions.map(action => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                onClick={action.onClick}
                className="text-xs h-7"
              >
                {action.label}
              </Button>
            ))}
          </div>
          <div className="h-4 w-px bg-white/20" />
          <button onClick={onClear} className="text-white/60 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
