'use client'

import { useTranslation } from '@/hooks/use-translation'

/**
 * Renders translated text by key path.
 * Can be used in both client and server components (it's a client component).
 */
export function T({ path }: { path: string }) {
  const { t } = useTranslation()
  return <>{t(path)}</>
}
