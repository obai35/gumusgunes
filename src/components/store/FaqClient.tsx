'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

export interface FaqItem {
  category: string
  question: string
  answer: string
}

export function FaqClient({ faqs }: { faqs: FaqItem[] }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const categories = [...new Set(faqs.map(f => f.category))]

  const filtered = faqs.filter(
    f => f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('faqPage.searchPlaceholder')} className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors" />
      </div>

      {categories.map(cat => {
        const items = filtered.filter(f => f.category === cat)
        if (items.length === 0) return null
        return (
          <div key={cat} className="mb-10">
            <h2 className="text-xs tracking-widest uppercase text-gold font-semibold mb-4">{cat}</h2>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const i = faqs.indexOf(item)
                const open = openIndex === i
                return (
                  <div key={idx} className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden">
                    <button onClick={() => setOpenIndex(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-navy font-medium hover:bg-secondary/40 transition-colors">
                      <span>{item.question}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{item.answer}</div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">{t('faqPage.noResults', search)}</p>
      )}
    </>
  )
}