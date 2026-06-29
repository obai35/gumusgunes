'use client'

import { useState } from 'react'

const WALLETS: Record<string, { label: string; number: string }> = {
  'vodafone-cash': { label: 'Vodafone Cash', number: process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER || '0100xxxxxxx' },
  'orange-cash': { label: 'Orange Cash', number: process.env.NEXT_PUBLIC_ORANGE_CASH_NUMBER || '0100xxxxxxx' },
  'etisalat-wallet': { label: 'Etisalat Wallet', number: process.env.NEXT_PUBLIC_ETISALAT_WALLET_NUMBER || '0100xxxxxxx' },
  'fawry': { label: 'Fawry', number: process.env.NEXT_PUBLIC_FAWRY_REFERENCE || 'xxxxx' },
}

export default function WalletPayment({ provider, onReference }: { provider: string; onReference: (ref: string) => void }) {
  const wallet = WALLETS[provider]
  const [ref, setRef] = useState('')

  if (!wallet) return null

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <p className="text-sm font-medium text-navy">Send payment to:</p>
        <p className="text-lg font-bold text-navy mt-1">{wallet.label}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Number: <span className="font-mono font-medium text-navy">{wallet.number}</span>
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
          placeholder="Enter reference after sending"
        />
      </div>
    </div>
  )
}
