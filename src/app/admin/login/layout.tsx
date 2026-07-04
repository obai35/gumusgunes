import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Gümüş Güneş admin panel login.",
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
