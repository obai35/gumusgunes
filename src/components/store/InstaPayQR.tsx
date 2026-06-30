'use client'

import { useState } from 'react'

export default function InstaPayQR({ onReference }: { onReference: (ref: string) => void }) {
  const [ref, setRef] = useState('')

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-border p-4 text-center">
        <img
          src={process.env.NEXT_PUBLIC_INSTAPAY_QR_URL || '/images/instapay-qr.png'}
          alt="InstaPay QR"
          loading="lazy"
          className="mx-auto w-48 h-48 object-contain"
        />
        <p className="text-sm text-muted-foreground mt-2">Scan with your banking app</p>
        <p className="text-sm font-medium text-navy mt-1">
          Phone: {process.env.NEXT_PUBLIC_INSTAPAY_PHONE}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-navy">Transaction Reference</label>
        <input
          type="text"
          required
          value={ref}
          onChange={e => { setRef(e.target.value); onReference(e.target.value) }}
          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1"
          placeholder="Enter reference number after payment"
        />
      </div>
    </div>
  )
}
