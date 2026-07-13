'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

const faqs = [
  { category: 'Ordering', q: 'How do I place an order?', a: 'Browse our collection, select your items, and proceed to checkout. You can pay via credit card, bank transfer, Instapay, Vodafone Cash, or cash on delivery.' },
  { category: 'Ordering', q: 'Can I modify or cancel my order?', a: 'Orders can be modified or cancelled within 1 hour of placement. Please contact our concierge team at concierge@gumusgunes.com for assistance.' },
  { category: 'Ordering', q: 'Do you offer gift wrapping?', a: 'Yes! Every order arrives in our signature gift box, ready for gifting. Complimentary gift messaging is available at checkout.' },
  { category: 'Shipping', q: 'What are your shipping options?', a: 'We offer standard (5-8 business days) and express (1-3 business days) shipping within Egypt. International shipping takes 7-14 business days.' },
  { category: 'Shipping', q: 'Do you ship internationally?', a: 'Yes, we ship worldwide! International shipping rates are calculated at checkout based on destination and weight.' },
  { category: 'Shipping', q: 'How can I track my order?', a: 'Once your order ships, you will receive a tracking number via email. You can also track your order from your account dashboard.' },
  { category: 'Returns', q: 'What is your return policy?', a: 'We accept returns within 30 days of delivery. Items must be unworn with original packaging. Personalized items are final sale.' },
  { category: 'Returns', q: 'How do I initiate a return?', a: 'Contact our concierge team at concierge@gumusgunes.com with your order number. We will provide a return label and instructions.' },
  { category: 'Returns', q: 'When will I receive my refund?', a: 'Refunds are processed within 5-7 business days after we receive your return. The amount will be credited to your original payment method.' },
  { category: 'Product Care', q: 'How do I care for my jewelry?', a: 'Store in a dry place, avoid contact with water and perfumes. Clean with a soft, dry cloth. Our stainless steel is tarnish-resistant but gentle care extends its life.' },
  { category: 'Product Care', q: 'Is stainless steel jewelry hypoallergenic?', a: 'Yes, our premium stainless steel is nickel-free and hypoallergenic, suitable for sensitive skin.' },
  { category: 'Account', q: 'How do I create an account?', a: 'Click the user icon in the top right and select "Sign Up". Enter your name, email, and password to create your account.' },
  { category: 'Account', q: 'I forgot my password. What should I do?', a: 'Click "Forgot Password" on the login page and enter your email. We will send you a reset link.' },
]

const categories = ['Ordering', 'Shipping', 'Returns', 'Product Care', 'Account']

export default function FaqPage() {
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filtered = faqs.filter(
    f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
                <li><span className="mx-2">/</span></li>
                <li className="text-navy font-medium">FAQ</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Find answers to common questions about ordering, shipping, returns, and more.
            </p>
          </motion.div>

          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions or keywords…"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
            />
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
                        <button
                          onClick={() => setOpenIndex(open ? null : i)}
                          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-navy font-medium hover:bg-secondary/40 transition-colors"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                          />
                        </button>
                        <motion.div
                          initial={false}
                          animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                            {item.a}
                          </div>
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No results found for "{search}".</p>
          )}
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
