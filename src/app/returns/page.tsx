'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { RotateCcw, ShieldCheck, Clock, Mail, AlertTriangle, CheckCircle } from 'lucide-react'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

const sections = [
  {
    icon: RotateCcw,
    title: '30-Day Return Policy',
    description: 'We stand behind every piece. If you are not completely satisfied, you may return your purchase within 30 days of delivery for a full refund or exchange.',
    details: [
      'Items must be unworn and in their original condition.',
      'All original packaging and documentation must be included.',
      'Returns must be initiated within 30 calendar days of delivery.',
      'Refunds are issued to the original payment method.',
    ],
  },
  {
    icon: Mail,
    title: 'How to Initiate a Return',
    description: 'We make the process simple. Here is how to get started:',
    steps: [
      'Contact our concierge team at concierge@gumusgunes.com with your order number.',
      'You will receive a prepaid return label and step-by-step instructions via email.',
      'Pack your items securely in the original packaging, including all accessories and documentation.',
      'Ship the package back using the provided label. We recommend keeping the tracking number.',
    ],
  },
  {
    icon: Clock,
    title: 'Refund Timeline',
    description: 'Once your return is received, here is what to expect:',
    details: [
      'Returns are processed within 5–7 business days after arrival at our facility.',
      'The refund amount will be credited to your original payment method.',
      'You will receive an email confirmation once your refund has been issued.',
      'Depending on your bank, it may take an additional 2–5 business days for the funds to appear.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Exchanges',
    description: 'Need a different size or style? We are happy to help.',
    details: [
      'Follow the same return process outlined above.',
      'Clearly specify the item you would like in exchange in your email to our concierge team.',
      'Exchanges are shipped free of charge once your return is received.',
      'If the exchange item has a price difference, we will contact you before proceeding.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Non-Returnable Items',
    description: 'For hygiene and customization reasons, the following items are final sale:',
    details: [
      'Personalized or custom-engraved items cannot be returned or exchanged.',
      'Earrings and other pierced jewelry are final sale for hygiene purposes.',
      'Items marked as "final sale" on the product page are not eligible for return.',
      'Gift cards are non-refundable and cannot be exchanged for cash.',
    ],
  },
  {
    icon: CheckCircle,
    title: 'Condition Requirements',
    description: 'To ensure a smooth return, please make sure your items meet these criteria:',
    details: [
      'Items must not show any signs of wear, scratches, or tarnish.',
      'All tags, labels, and authenticity cards must be intact and attached.',
      'Original packaging (gift box, pouch, care card) must be included.',
      'Items returned in unsalable condition may be subject to a restocking fee.',
    ],
  },
]

export default function ReturnsPage() {
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
                <li className="text-navy font-medium">Returns &amp; Exchanges</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2">Returns &amp; Exchanges</h1>
            <p className="text-muted-foreground mb-10 max-w-xl">
              Our 30-day return policy is designed to give you complete confidence in every purchase.
            </p>
          </motion.div>

          <div className="space-y-10">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex gap-5"
                >
                  <div className="shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-display font-semibold text-navy mb-1">{section.title}</h2>
                    <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                    {'steps' in section ? (
                      <ol className="space-y-2">
                        {section.steps!.map((step, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-navy text-silver text-xs flex items-center justify-center font-medium mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <ul className="space-y-1.5">
                        {section.details!.map((detail, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-silver mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
