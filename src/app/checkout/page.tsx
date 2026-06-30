import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { CheckoutContent } from '@/components/store/CheckoutContent'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <CheckoutContent />
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
