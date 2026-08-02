'use client'

import { useState } from 'react'
import { Barcode, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export function BarcodeGenerator({ productId, sku }: { productId: string; sku: string }) {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [loading, setLoading] = useState(false)

  async function downloadBarcode() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/barcode`)
      if (!res.ok) { toast.error(ta('Failed to generate barcode')); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sku}-barcode.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(ta('Barcode downloaded'))
    } catch { toast.error(ta('Failed to download barcode')) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 mt-6">
      <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2"><Barcode className="h-4 w-4" /> {ta('Barcode')}</h2>
      <p className="text-sm text-muted-foreground mb-3">{ta('Generate an EAN-13 barcode for this product.')}</p>
      <button onClick={downloadBarcode} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
        <Download className="h-4 w-4" /> {loading ? ta('Generating...') : ta('Download Barcode PNG')}
      </button>
    </div>
  )
}
