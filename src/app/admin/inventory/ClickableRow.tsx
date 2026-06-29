'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export default function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter()
  return (
    <tr className="border-b border-border/50 hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(href)}>
      {children}
    </tr>
  )
}
