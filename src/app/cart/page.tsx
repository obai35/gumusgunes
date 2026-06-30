import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { CartContent } from '@/components/store/CartContent'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-silver mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-navy font-medium">Cart</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-display text-navy mb-6">Shopping Cart</h1>
        <CartContent />
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
