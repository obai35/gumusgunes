'use client'

import { ErrorFallback } from '@/components/store/ErrorFallback'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('Root error boundary caught:', error.message, error.stack)
  return <ErrorFallback error={error} reset={reset} message={error.message} />
}
