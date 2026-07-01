'use client'

type Props = {
  method: { code: string; name: string; config: { phone?: string; qrUrl?: string } }
  onReference: (ref: string) => void
}

export default function InstaPayQR({ method, onReference }: Props) {
  return (
    <div className="space-y-3">
      {method.config.qrUrl && (
        <img src={method.config.qrUrl} alt="InstaPay QR" className="w-48 h-48 mx-auto" />
      )}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="text-muted-foreground">Phone: <span className="font-mono font-bold text-navy">{method.config.phone || 'Not configured'}</span></p>
      </div>
      <input
        onChange={e => onReference(e.target.value)}
        placeholder="Enter transaction reference"
        className="w-full px-3 py-2 border border-border rounded-lg text-sm"
      />
    </div>
  )
}
