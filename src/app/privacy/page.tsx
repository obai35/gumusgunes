import type { Metadata } from 'next'
import { LegalPage } from '@/components/store/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy — Gümüş Güneş',
  description: 'How Gümüş Güneş collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="Last updated: January 2026"
      sections={[
        {
          heading: '1. Information We Collect',
          body: 'We collect information you provide directly, such as your name, email address, phone number, and shipping details when you place an order, create an account, or subscribe to our newsletter. We also collect payment information, which is processed securely by our payment providers and never stored on our servers.',
        },
        {
          heading: '2. How We Use Your Information',
          body: 'We use your information to process orders, deliver products, provide customer support, personalise your shopping experience, and send you updates about our collections if you have opted in. We never sell your personal data to third parties.',
        },
        {
          heading: '3. Cookies',
          body: 'We use essential cookies to keep your cart and session functional, and analytics cookies to understand how our site is used so we can improve it. You can control cookies through your browser settings at any time.',
        },
        {
          heading: '4. Data Security',
          body: 'Your data is protected with industry-standard encryption and access controls. All payment transactions are handled by PCI-DSS compliant providers.',
        },
        {
          heading: '5. Your Rights',
          body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting our concierge team. You can also unsubscribe from marketing emails with one click.',
        },
      ]}
    />
  )
}
