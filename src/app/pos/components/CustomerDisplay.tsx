'use client'

import { memo } from 'react'
import { formatPrice } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'

type Props = {
  itemCount: number
  total: number
}

function CustomerDisplay({ itemCount, total }: Props) {
  const { t } = useTranslation()
  const label = itemCount === 1 ? t('admin.pos.item') : t('admin.pos.items')
  return (
    <div className="fixed bottom-20 right-4 pos-glass-strong rounded-xl pos-glow p-4 min-w-[200px] text-center z-40">
      <p className="text-xs text-gold/60 uppercase tracking-wide mb-1">{t('admin.pos.customerTotal')}</p>
      <p className="text-3xl font-bold text-gold">{formatPrice(total)}</p>
      <p className="text-xs text-white/40 mt-1">{itemCount} {label}</p>
    </div>
  )
}

export default memo(CustomerDisplay)
