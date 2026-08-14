import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { db } from '@/lib/db'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { FaqClient, type FaqItem } from '@/components/store/FaqClient'
import { T } from '@/components/store/Translated'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const metadata: Metadata = {
  title: "FAQ — Gümüş Güneş",
  description: "Answers to common questions about ordering, shipping, returns, and caring for your handcrafted stainless steel accessories from Gümüş Güneş.",
  openGraph: {
    title: "FAQ — Gümüş Güneş",
    description: "Answers to common questions about ordering, shipping, returns, and caring for your pieces.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — Gümüş Güneş",
    description: "Answers to common questions about ordering, shipping, returns, and caring for your pieces.",
  },
}

const fallbackFaqs: FaqItem[] = [
  { category: 'Ordering', question: 'How do I place an order?', answer: 'Browse our collection, select your items, and proceed to checkout. You can pay via credit card, bank transfer, Instapay, Vodafone Cash, or cash on delivery.' },
  { category: 'Ordering', question: 'Can I modify or cancel my order?', answer: 'Orders can be modified or cancelled within 1 hour of placement. Please contact our concierge team for assistance.' },
  { category: 'Shipping', question: 'What are your shipping options?', answer: 'We offer standard (5-8 business days) and express (1-3 business days) shipping within Egypt. International shipping takes 7-14 business days.' },
  { category: 'Returns', question: 'What is your return policy?', answer: 'We accept returns within 30 days of delivery. Items must be unworn with original packaging. Personalized items are final sale.' },
  { category: 'Product Care', question: 'How do I care for my jewelry?', answer: 'Store in a dry place, avoid contact with water and perfumes. Clean with a soft, dry cloth.' },
  { category: 'Account', question: 'How do I create an account?', answer: 'Click the user icon in the top right and select "Sign Up". Enter your name, email, and password to create your account.' },
]

export default async function FaqPage() {
  let faqs: FaqItem[] = fallbackFaqs
  try {
    const rows = await db.faqEntry.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { question: true, answer: true, category: true },
    })
    if (rows.length > 0) {
      faqs = rows
    }
  } catch {
    // DB unreachable — fall back to the curated static list
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div>
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li><a href="/" className="hover:text-gold transition-colors"><T path="nav.home" /></a></li>
                <li><span className="mx-2">/</span></li>
                <li className="text-navy font-medium"><T path="faqPage.faq" /></li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2"><T path="faqPage.title" /></h1>
            <p className="text-muted-foreground mb-8 max-w-xl"><T path="faqPage.description" /></p>
          </div>

          <FaqClient faqs={faqs} />
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}