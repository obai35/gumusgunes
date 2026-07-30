'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useTranslation } from '@/hooks/use-translation'
import { useLocale } from '@/lib/store'
import { translations } from '@/lib/i18n/translations'
import { RotateCcw, ShieldCheck, Clock, Mail, AlertTriangle, CheckCircle } from 'lucide-react'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

interface SectionConfig {
  icon: any
  titleKey: string
  descKey: string
  itemsKey: string
  isOrdered: boolean
}

const sectionConfigs: SectionConfig[] = [
  { icon: RotateCcw, titleKey: 'returnPolicy', descKey: 'returnPolicyDescription', itemsKey: 'returnPolicyItems', isOrdered: false },
  { icon: Mail, titleKey: 'initiateReturn', descKey: 'initiateReturnDescription', itemsKey: 'initiateReturnSteps', isOrdered: true },
  { icon: Clock, titleKey: 'refundTimeline', descKey: 'refundTimelineDescription', itemsKey: 'refundTimelineItems', isOrdered: false },
  { icon: ShieldCheck, titleKey: 'exchanges', descKey: 'exchangesDescription', itemsKey: 'exchangesItems', isOrdered: false },
  { icon: AlertTriangle, titleKey: 'nonReturnable', descKey: 'nonReturnableDescription', itemsKey: 'nonReturnableItems', isOrdered: false },
  { icon: CheckCircle, titleKey: 'conditionRequirements', descKey: 'conditionRequirementsDescription', itemsKey: 'conditionRequirementsItems', isOrdered: false },
]

export default function ReturnsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()

  function getSectionList(config: SectionConfig): string[] {
    const dict = locale === 'ar' ? translations.ar : translations.en
    const items = (dict as any).returnsPage?.[config.itemsKey]
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
                <li className="text-navy font-medium">{t('returnsPage.returns')}</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2">{t('returnsPage.title')}</h1>
            <p className="text-muted-foreground mb-10 max-w-xl">
              {t('returnsPage.description')}
            </p>
          </motion.div>

          <div className="space-y-10">
            {sectionConfigs.map((section, index) => {
              const items = getSectionList(section)
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
                  <div className="flex-1">
                    <h2 className="text-lg font-display font-semibold text-navy mb-1">{t('returnsPage.' + section.titleKey)}</h2>
                    <p className="text-sm text-muted-foreground mb-3">{t('returnsPage.' + section.descKey)}</p>
                    {section.isOrdered ? (
                      <ol className="space-y-2">
                        {items.map((step, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-navy text-silver text-xs flex items-center justify-center font-medium mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <ul className="space-y-1.5">
                        {items.map((detail, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-silver mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
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
