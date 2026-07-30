import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { CartContent } from '@/components/store/CartContent'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { T } from '@/components/store/Translated'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your items and proceed to checkout.",
}

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <nav className="text-xs sm:text-sm text-silver mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <li><a href="/" className="hover:text-gold transition-colors"><T path="nav.home" /></a></li>
            <li><span className="mx-1 sm:mx-2">/</span></li>
            <li className="text-navy font-medium"><T path="cartPage.cart" /></li>
          </ol>
        </nav>
        <h1 className="text-xl sm:text-2xl font-display text-navy mb-6"><T path="cartPage.title" /></h1>
        <ErrorBoundary>
          <CartContent />
        </ErrorBoundary>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
