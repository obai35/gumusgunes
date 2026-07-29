import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Store Builder',
  description: 'White-label store provisioning system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  )
}