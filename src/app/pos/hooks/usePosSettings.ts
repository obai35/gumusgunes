'use client'

import { useEffect } from 'react'
import { posFetch } from '@/lib/pos-client-fetch'
import { setRuntimeCurrency } from '@/lib/format'
import { usePosStore } from '../stores/posStore'

export function usePosSettings(active: boolean) {
  useEffect(() => {
    if (!active) return
    let cancelled = false
    posFetch('/api/admin/pos/settings')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.ok) return
        setRuntimeCurrency(data.currencySymbol, data.currencyCode)
        const rate = parseFloat(data.taxRate)
        if (rate > 0) {
          const s = usePosStore.getState()
          if (s.taxRate === 0) s.setTaxRate(rate)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [active])
}
