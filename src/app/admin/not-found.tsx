import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6">
        <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-4xl font-display font-semibold text-navy mb-2">404</h1>
      <p className="text-muted-foreground mb-6">This page doesn&apos;t exist.</p>
      <Link
        href="/admin"
        className="px-6 py-2.5 bg-navy text-silver rounded-full text-sm font-medium hover:bg-navy/90 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
