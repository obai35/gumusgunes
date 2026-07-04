import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your profile, orders, and saved addresses.",
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
