'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Package, Truck, Globe, Clock, Shield, CreditCard } from 'lucide-react'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

const sections = [
  {
    icon: Truck,
    title: 'Shipping Options',
    items: [
      'Standard Shipping: 5–8 business days — Free on orders over 250 EGP',
      'Express Shipping: 1–3 business days — Flat rate 50 EGP',
      'International Shipping: 7–14 business days — Calculated at checkout',
    ],
  },
  {
    icon: Clock,
    title: 'Order Processing',
    items: [
      'Orders are processed within 24 hours of placement.',
      'You will receive a tracking number via email once your order ships.',
    ],
  },
  {
    icon: Globe,
    title: 'International Shipping',
    items: [
      'We offer worldwide shipping to most countries.',
      'Customs duties and import taxes may apply depending on your country\'s regulations.',
    ],
  },
  {
    icon: Shield,
    title: 'Shipping Insurance',
    items: [
      'All packages are insured against loss and damage during transit.',
      'If your order arrives damaged, contact our concierge team for a replacement.',
    ],
  },
  {
    icon: CreditCard,
    title: 'Payment Methods',
    items: [
      'Credit / Debit Card (Visa, Mastercard)',
      'Bank Transfer',
      'Instapay',
      'Vodafone Cash',
      'Cash on Delivery',
    ],
  },
]

export default function ShippingPage() {
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
                <li className="text-navy font-medium">Shipping</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2">Shipping Information</h1>
            <p className="text-muted-foreground mb-10 max-w-xl">
              Everything you need to know about how we deliver your handcrafted accessories.
            </p>
          </motion.div>

          <div className="space-y-10">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex gap-5"
              >
                <div className="shrink-0 mt-1">
                  <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-gold" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-navy mb-2">{section.title}</h2>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-silver mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
