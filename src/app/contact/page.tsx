'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/use-translation'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))



const contactInfo = [
  { icon: Mail, label: "Email", value: "concierge@gumusgunes.com", href: "mailto:concierge@gumusgunes.com" },
  { icon: Phone, label: "Phone", value: "+90 212 000 00 00", href: "tel:+902120000000" },
  { icon: MapPin, label: "Address", value: "Grand Bazaar, Nuruosmaniye No. 42, Istanbul, Türkiye" },
  { icon: Clock, label: "Hours", value: "Mon–Sat 9:00 AM – 7:00 PM" },
]

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !subject || !message) {
      toast.error(t('contactPage.validationError'))
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      toast.success(t('contactPage.success'))
      setName(''); setEmail(''); setSubject(''); setMessage('')
    } catch {
      toast.error(t('contactPage.error'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li><a href="/" className="hover:text-gold transition-colors">{t('nav.home')}</a></li>
                <li><span className="mx-2">/</span></li>
                <li className="text-navy font-medium">{t('contactPage.contact')}</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2">{t('contactPage.getInTouch')}</h1>
            <p className="text-muted-foreground mb-12 max-w-xl">
              {t('contactPage.description')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              {contactInfo.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-4 p-5 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="h-10 w-10 rounded-lg bg-navy text-silver flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs tracking-widest uppercase text-gold font-medium mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-navy font-medium hover:text-gold transition-colors">{item.value}</a>
                      ) : (
                        <p className="text-navy font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5 p-8 rounded-2xl bg-secondary/30 border border-border/50">
                <h2 className="font-display text-2xl font-semibold text-navy mb-1">{t('contactPage.sendMessage')}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('contactPage.respondWithin')}</p>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-navy mb-1.5">{t('contactPage.name')}</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                    placeholder={t('contactPage.namePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-navy mb-1.5">{t('contactPage.email')}</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                    placeholder={t('contactPage.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-navy mb-1.5">{t('contactPage.subject')}</label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                    placeholder={t('contactPage.subjectPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-navy mb-1.5">{t('contactPage.message')}</label>
                  <textarea
                    id="message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors resize-none"
                    placeholder={t('contactPage.messagePlaceholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full h-12 rounded-lg bg-navy text-silver font-semibold text-sm tracking-wide hover:bg-gold hover:text-navy-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('contactPage.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t('contactPage.submit')}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}


