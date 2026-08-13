import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Gümüş Güneş account for faster checkout and order tracking.",
  robots: { index: false, follow: false },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
