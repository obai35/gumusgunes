import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { CheckoutContent } from '@/components/store/CheckoutContent'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order securely.",
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream px-4 sm:px-6">
        <ErrorBoundary>
          <CheckoutContent />
        </ErrorBoundary>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
