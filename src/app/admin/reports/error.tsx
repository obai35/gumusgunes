'use client'

import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { ta } = useAdminTranslate()
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-navy mb-2">{ta('Something went wrong')}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {error.message || ta('An unexpected error occurred. Please try again.')}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-navy text-silver rounded-full text-sm font-medium hover:bg-navy/90 transition-colors"
      >
        {ta('Try Again')}
      </button>
    </div>
  )
}
