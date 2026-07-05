'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  error?: Error & { digest?: string }
  reset?: () => void
  title?: string
  message?: string
}

export function ErrorFallback({ reset, title = 'Something went wrong', message = 'An unexpected error occurred. Please try again.' }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-gold/30 mx-auto mb-6">
          <img src="/gumusgunes-logo.jpeg" alt="Gümüş Güneş" className="h-full w-full object-cover" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          {reset && (
            <Button onClick={reset} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">
              Try Again
            </Button>
          )}
          <Link href="/" className="text-sm text-gold hover:underline font-medium">Go Home</Link>
        </div>
      </div>
    </div>
  )
}
