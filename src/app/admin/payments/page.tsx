'use client'

import { useState } from 'react'
import SettingsTab from '@/components/admin/payments/SettingsTab'
import VerificationTab from '@/components/admin/payments/VerificationTab'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

const TABS = [
  { id: 'settings', label: 'Settings' },
  { id: 'verification', label: 'Verification' },
]

export default function AdminPaymentsPage() {
  const { ta } = useAdminTranslate()
  const [activeTab, setActiveTab] = useState('settings')

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">{ta('Payment Management')}</h1>
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-navy border-b-2 border-navy'
                : 'text-muted-foreground hover:text-navy'
            }`}
          >
            {ta(tab.label)}
          </button>
        ))}
      </div>
      {activeTab === 'settings' && <SettingsTab />}
      {activeTab === 'verification' && <VerificationTab />}
    </div>
  )
}
