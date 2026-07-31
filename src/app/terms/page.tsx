import type { Metadata } from 'next'
import { LegalPage } from '@/components/store/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service — Gümüş Güneş',
  description: 'The terms and conditions that govern the use of the Gümüş Güneş website and purchases.',
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="Last updated: January 2026"
      sections={[
        {
          heading: '1. Acceptance of Terms',
          body: 'By accessing or purchasing from the Gümüş Güneş website, you agree to be bound by these terms. If you do not agree, please do not use our services.',
        },
        {
          heading: '2. Products & Pricing',
          body: 'All pieces are handcrafted from sterling silver, so slight variations in weight and finish are natural and part of each item\'s character. Prices are listed in the currency shown and may change without notice. We reserve the right to correct any pricing errors.',
        },
        {
          heading: '3. Orders & Payment',
          body: 'Orders are confirmed once payment is authorised. We accept major credit cards and secure online payment methods. If we are unable to fulfil an order, we will notify you and issue a full refund.',
        },
        {
          heading: '4. Shipping & Returns',
          body: 'Please refer to our Shipping and Returns pages for delivery times, costs, and our 30-day return policy.',
        },
        {
          heading: '5. Intellectual Property',
          body: 'All content on this site — including designs, images, and text — is the property of Gümüş Güneş and may not be reproduced without written permission.',
        },
        {
          heading: '6. Limitation of Liability',
          body: 'Gümüş Güneş is not liable for indirect or consequential damages arising from the use of our products or website, to the fullest extent permitted by law.',
        },
      ]}
    />
  )
}
