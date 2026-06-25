'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Type, Check } from 'lucide-react'
import { cn } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'

const ENGRAVING_PRICE = 15
const MAX_CHARS = 12
const ALLOWED_FONTS = [
  { id: 'serif', name: 'engravings.classic', sample: 'ABC' },
  { id: 'script', name: 'engravings.script', sample: 'ABC' },
  { id: 'mono', name: 'engravings.modern', sample: 'ABC' },
]

export function EngravingOption({
  enabled,
  text,
  font,
  price,
  onToggle,
  onTextChange,
  onFontChange,
}: {
  enabled: boolean
  text: string
  font: string
  price: number
  onToggle: (enabled: boolean) => void
  onTextChange: (text: string) => void
  onFontChange: (font: string) => void
}) {
  const { t } = useTranslation()
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className={cn(
      'p-4 rounded-xl border-2 transition-colors',
      enabled ? 'border-gold bg-gold/5' : 'border-border bg-secondary/30'
    )}>
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => onToggle(!enabled)}
      >
        <div className={cn(
          'h-5 w-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors',
          enabled ? 'bg-gold border-gold' : 'border-border'
        )}>
          {enabled && <Check className="h-3 w-3 text-navy-deep" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Type className="h-4 w-4 text-gold" />
            <span className="font-display text-sm font-semibold text-navy">
              {t('engravings.title')}
            </span>
            <span className="ml-auto text-sm font-semibold text-gold">
              {t('engravings.fee')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('engravings.engravingDesc', MAX_CHARS)}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3 pt-3 border-t border-gold/20 space-y-3">
              {/* Font selector */}
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium mb-1.5 block">
                  {t('engravings.font')}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ALLOWED_FONTS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onFontChange(f.id)}
                      className={cn(
                        'py-2 px-2 rounded-lg border-2 text-center transition-colors',
                        font === f.id
                          ? 'border-gold bg-gold/10'
                          : 'border-border hover:border-gold/40'
                      )}
                    >
                      <span
                        className={cn(
                          'block text-base font-semibold text-navy',
                          f.id === 'serif' && 'font-display',
                          f.id === 'script' && 'italic',
                          f.id === 'mono' && 'font-mono'
                        )}
                      >
                        {f.sample}
                      </span>
                      <span className="text-[9px] text-muted-foreground tracking-wide">{t(f.name)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium">
                    {t('engravings.addEngraving')}
                  </label>
                  <span className={cn(
                    'text-[10px] font-medium',
                    text.length > MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {t('engravings.charsLeft', MAX_CHARS - text.length)}
                  </span>
                </div>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => onTextChange(e.target.value.slice(0, MAX_CHARS).toUpperCase())}
                  placeholder={t('engravings.placeholder')}
                  maxLength={MAX_CHARS}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold text-navy placeholder:text-muted-foreground/50 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-gold uppercase tracking-widest"
                />
              </div>

              {/* Live preview */}
              {text && (
                <div className="p-3 rounded-lg bg-navy text-silver text-center">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-gold-soft mb-1">{t('engravings.preview')}</p>
                  <p
                    className={cn(
                      'text-xl font-semibold silver-text tracking-[0.3em]',
                      font === 'serif' && 'font-display',
                      font === 'script' && 'italic',
                      font === 'mono' && 'font-mono'
                    )}
                  >
                    {text || '—'}
                  </p>
                  <p className="text-[9px] text-silver/40 mt-1">{t('engravings.previewLabel')}</p>
                </div>
              )}

              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-gold flex-shrink-0 mt-0.5" />
                <p>{t('engravings.footnote')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { ENGRAVING_PRICE }
