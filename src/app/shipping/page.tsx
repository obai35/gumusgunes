'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useTranslation } from '@/hooks/use-translation'
import { useLocale } from '@/lib/store'
import { translations } from '@/lib/i18n/translations'
import { Truck, Globe, Clock, Shield, CreditCard } from 'lucide-react'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

const sectionConfigs = [
  { icon: Truck, titleKey: 'shippingOptions', itemsKey: 'shippingItems' },
  { icon: Clock, titleKey: 'orderProcessing', itemsKey: 'orderProcessingItems' },
  { icon: Globe, titleKey: 'internationalShipping', itemsKey: 'internationalShippingItems' },
  { icon: Shield, titleKey: 'shippingInsurance', itemsKey: 'shippingInsuranceItems' },
  { icon: CreditCard, titleKey: 'paymentMethods', itemsKey: 'paymentMethodsItems' },
]

export default function ShippingPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()

  function getSectionItems(config: typeof sectionConfigs[number]): string[] {
    const dict = locale === 'ar' ? translations.ar : translations.en
    const items = (dict as any).shippingPage?.[config.itemsKey]
    return Array.isArray(items) ? items : []
  }

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
                <li><a href="/" className="hover:text-gold transition-colors">{t('nav.home')}</a></li>
                <li><span className="mx-2">/</span></li>
                <li className="text-navy font-medium">{t('shippingPage.shipping')}</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2">{t('shippingPage.title')}</h1>
            <p className="text-muted-foreground mb-10 max-w-xl">
              {t('shippingPage.description')}
            </p>
          </motion.div>

          <div className="space-y-10">
            {sectionConfigs.map((section, index) => {
              const items = getSectionItems(section)
              return (
              <motion.div
                key={section.titleKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex gap-5"
              >
                <div className="shrink-0 mt-1">
                  <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-gold" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-navy mb-2">{t('shippingPage.' + section.titleKey)}</h2>
                  <ul className="space-y-1.5">
                    {items.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-silver mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
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
