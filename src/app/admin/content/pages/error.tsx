'use client'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { ta } = useAdminTranslate()
  return <div className="p-6 text-center"><p className="text-red-600 mb-4">{ta('Failed to load pages')}</p><button onClick={reset} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm">{ta('Retry')}</button></div>
}
