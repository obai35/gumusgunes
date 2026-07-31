import type { Metadata } from 'next'
import { LegalPage } from '@/components/store/LegalPage'

export const metadata: Metadata = {
  title: 'Cookie Policy — Gümüş Güneş',
  description: 'How Gümüş Güneş uses cookies and similar technologies on our website.',
}

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      updated="Last updated: January 2026"
      sections={[
        {
          heading: '1. What Are Cookies?',
          body: 'Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how it is used.',
        },
        {
          heading: '2. Cookies We Use',
          body: 'Essential cookies keep the site working — including your cart, session, and login state. Analytics cookies (anonymised) help us understand page usage so we can improve our collections and layout. Preference cookies remember your language and currency choices.',
        },
        {
          heading: '3. Managing Cookies',
          body: 'You can block or delete cookies in your browser settings. Note that disabling essential cookies may affect how the site functions, including the ability to add items to your cart.',
        },
        {
          heading: '4. Third-Party Services',
          body: 'Our payment and analytics partners may set their own cookies when you interact with their services. These are governed by their respective privacy policies.',
        },
      ]}
    />
  )
}
