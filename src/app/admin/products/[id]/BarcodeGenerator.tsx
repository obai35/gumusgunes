'use client'

import { useState } from 'react'
import { Barcode, Download } from 'lucide-react'
import { toast } from 'sonner'

export function BarcodeGenerator({ productId, sku }: { productId: string; sku: string }) {
  const [loading, setLoading] = useState(false)

  async function downloadBarcode() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/barcode`)
      if (!res.ok) { toast.error('Failed to generate barcode'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sku}-barcode.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Barcode downloaded')
    } catch { toast.error('Failed to download barcode') }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 mt-6">
      <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2"><Barcode className="h-4 w-4" /> Barcode</h2>
      <p className="text-sm text-muted-foreground mb-3">Generate an EAN-13 barcode for this product.</p>
      <button onClick={downloadBarcode} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
        <Download className="h-4 w-4" /> {loading ? 'Generating...' : 'Download Barcode PNG'}
      </button>
    </div>
  )
}
