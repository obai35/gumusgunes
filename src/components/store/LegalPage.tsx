import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

type Section = { heading: string; body: string }

export function LegalPage({
  eyebrow,
  title,
  updated,
  sections,
}: {
  eyebrow: string
  title: string
  updated: string
  sections: Section[]
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-navy-deep py-16 sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.12)_0%,_transparent_60%)]" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">{eyebrow}</span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-silver mt-4 mb-3">
              {title}
            </h1>
            <p className="text-silver/50 text-sm">{updated}</p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-display text-2xl font-semibold text-navy mb-3">{section.heading}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-xs text-muted-foreground/70">
            Questions? Contact our concierge team at concierge@gumusgunes.com — we reply within 24 hours.
          </p>
        </section>
      </main>
      <Footer />
      <Suspense fallback={null}>
        <ConciergeChat />
      </Suspense>
    </>
  )
}
