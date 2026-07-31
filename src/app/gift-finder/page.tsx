import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { GiftFinder } from '@/components/store/GiftFinder'
import { BundleConfigurator } from '@/components/store/BundleConfigurator'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const metadata: Metadata = {
  title: 'Gift Finder — Gümüş Güneş',
  description: 'Answer four quick questions and we will curate the perfect handcrafted silver piece — wrapped, ready, and unforgettable.',
}

export default function GiftFinderPage() {
  return (
    <>
      <Header />
      <main>
        <GiftFinder />
        <BundleConfigurator />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <ConciergeChat />
      </Suspense>
    </>
  )
}
