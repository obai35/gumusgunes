'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type PaymentMethod = {
  id: string; code: string; name: string; nameAr: string | null
  description: string | null; descriptionAr: string | null
  isActive: boolean; sortOrder: number; config: Record<string, any>
}

type Props = {
  method: PaymentMethod
  onSave: (data: Partial<PaymentMethod> & { config: Record<string, any> }) => void
  onClose: () => void
}

const CONFIG_FIELDS: Record<string, { key: string; label: string; type: string }[]> = {
  card: [
    { key: 'publishableKey', label: 'Publishable Key', type: 'text' },
    { key: 'secretKey', label: 'Secret Key', type: 'password' },
    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
  ],
  paypal: [
    { key: 'clientId', label: 'Client ID', type: 'text' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    { key: 'sandbox', label: 'Sandbox Mode', type: 'checkbox' },
  ],
  transfer: [
    { key: 'bankName', label: 'Bank Name (English)', type: 'text' },
    { key: 'bankNameAr', label: 'Bank Name (Arabic)', type: 'text' },
    { key: 'iban', label: 'IBAN', type: 'text' },
    { key: 'referenceInstructions', label: 'Reference Instructions (English)', type: 'textarea' },
    { key: 'referenceInstructionsAr', label: 'Reference Instructions (Arabic)', type: 'textarea' },
  ],
  cod: [
    { key: 'handlingFee', label: 'Handling Fee (EGP)', type: 'number' },
  ],
  instapay: [
    { key: 'phone', label: 'Phone Number', type: 'text' },
    { key: 'qrUrl', label: 'QR Image URL', type: 'text' },
  ],
  'vodafone-cash': [
    { key: 'number', label: 'Wallet Number', type: 'text' },
  ],
  'orange-cash': [
    { key: 'number', label: 'Wallet Number', type: 'text' },
  ],
  'etisalat-wallet': [
    { key: 'number', label: 'Wallet Number', type: 'text' },
  ],
  fawry: [
    { key: 'reference', label: 'Fawry Reference', type: 'text' },
  ],
}

export default function MethodFormModal({ method, onSave, onClose }: Props) {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [name, setName] = useState(method.name)
  const [nameAr, setNameAr] = useState(method.nameAr || '')
  const [sortOrder, setSortOrder] = useState(method.sortOrder)
  const [config, setConfig] = useState<Record<string, any>>(method.config || {})

  const fields = CONFIG_FIELDS[method.code] || []

  function setConfigValue(key: string, value: any) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ name, nameAr: nameAr || null, sortOrder, config })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-navy">{ta('Configure')}: {method.name}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">{ta('Name (English)')}</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{ta('Name (Arabic)')}</label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{ta('Sort Order')}</label>
            <input value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} type="number" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          {fields.length > 0 && <hr className="border-border" />}
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground">{ta(f.label)}</label>
              {f.type === 'textarea' ? (
                <textarea value={config[f.key] || ''} onChange={e => setConfigValue(f.key, e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-20" />
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!config[f.key]} onChange={e => setConfigValue(f.key, e.target.checked)} className="accent-gold" />
                  {config[f.key] ? ta('Enabled') : ta('Disabled')}
                </label>
              ) : (
                <input value={config[f.key] || ''} onChange={e => setConfigValue(f.key, e.target.value)} type={f.type} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              )}
            </div>
          ))}
          <button type="submit" className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">{ta('Save')}</button>
        </form>
      </div>
    </div>
  )
}
