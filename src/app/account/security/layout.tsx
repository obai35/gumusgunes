import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Security Settings",
  description: "Manage your password and security preferences.",
}

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children
}
