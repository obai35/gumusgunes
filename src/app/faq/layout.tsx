import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "FAQ — Gümüş Güneş",
  description: "Frequently asked questions about ordering, shipping, returns, and product care for our handcrafted stainless steel accessories.",
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
