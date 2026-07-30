'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

const fallbackFaqs = [
  { category: 'Ordering', question: 'How do I place an order?', answer: 'Browse our collection, select your items, and proceed to checkout. You can pay via credit card, bank transfer, Instapay, Vodafone Cash, or cash on delivery.' },
  { category: 'Ordering', question: 'Can I modify or cancel my order?', answer: 'Orders can be modified or cancelled within 1 hour of placement. Please contact our concierge team for assistance.' },
  { category: 'Shipping', question: 'What are your shipping options?', answer: 'We offer standard (5-8 business days) and express (1-3 business days) shipping within Egypt. International shipping takes 7-14 business days.' },
  { category: 'Returns', question: 'What is your return policy?', answer: 'We accept returns within 30 days of delivery. Items must be unworn with original packaging. Personalized items are final sale.' },
  { category: 'Product Care', question: 'How do I care for my jewelry?', answer: 'Store in a dry place, avoid contact with water and perfumes. Clean with a soft, dry cloth.' },
  { category: 'Account', question: 'How do I create an account?', answer: 'Click the user icon in the top right and select "Sign Up". Enter your name, email, and password to create your account.' },
]

export default function FaqPage() {
  const { t } = useTranslation()
  const [faqs, setFaqs] = useState(fallbackFaqs)
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/content/faq')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data.filter((f: any) => f.isActive).map((f: any) => ({ category: f.category, question: f.question, answer: f.answer })))
        }
      })
      .catch(() => {})
  }, [])

  const categories = [...new Set(faqs.map(f => f.category))]

  const filtered = faqs.filter(
    f => f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li><a href="/" className="hover:text-gold transition-colors">{t('nav.home')}</a></li>
                <li><span className="mx-2">/</span></li>
                <li className="text-navy font-medium">{t('faqPage.faq')}</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2">{t('faqPage.title')}</h1>
            <p className="text-muted-foreground mb-8 max-w-xl">{t('faqPage.description')}</p>
          </motion.div>

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
            <p className="text-center text-muted-foreground py-12">{t('faqPage.noResults', { search })}</p>
          )}
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}








