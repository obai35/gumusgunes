'use client'

type Props = {
  method: { code: string; name: string; config: { number?: string } }
  onReference: (ref: string) => void
}

export default function WalletPayment({ method, onReference }: Props) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="text-muted-foreground">Send payment to:</p>
        <p className="font-mono font-bold text-navy text-lg">{method.config.number || 'Not configured'}</p>
        <p className="text-xs text-muted-foreground mt-1">{method.name}</p>
      </div>
      <input
        onChange={e => onReference(e.target.value)}
        placeholder="Enter transaction reference"
        className="w-full px-3 py-2 border border-border rounded-lg text-sm"
      />
    </div>
  )
}
