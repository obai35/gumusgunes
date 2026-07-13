import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact Us — Gümüş Güneş",
  description: "Get in touch with our concierge team for inquiries about our handcrafted stainless steel accessories.",
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
