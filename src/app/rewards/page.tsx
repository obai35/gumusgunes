import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { RewardsSection } from '@/components/store/RewardsSection'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const metadata: Metadata = {
  title: 'Rewards — Gümüş Güneş',
  description: 'Join the Gümüş Güneş loyalty program and earn rewards on every handcrafted silver piece you love.',
  robots: { index: false, follow: false },
}

export default function RewardsPage() {
  return (
    <>
      <Header />
      <main>
        <RewardsSection />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <ConciergeChat />
      </Suspense>
    </>
  )
}
