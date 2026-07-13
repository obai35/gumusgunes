import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { AboutSection } from '@/components/store/AboutSection'
import type { Metadata } from 'next'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const metadata: Metadata = {
  title: 'Our Story — Gümüş Güneş',
  description: 'Discover the story behind Gümüş Güneş, where handcrafted silver accessories meet the timeless beauty of Istanbul.',
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <AboutSection />
      </main>
      <Footer />
      <Suspense>
        <ConciergeChat />
      </Suspense>
    </>
  )
}
