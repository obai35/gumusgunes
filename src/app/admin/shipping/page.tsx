'use client'

import { useState } from 'react'
import MethodsTab from '@/components/admin/shipping/MethodsTab'
import RatesTab from '@/components/admin/shipping/RatesTab'
import RulesTab from '@/components/admin/shipping/RulesTab'
import ShipmentsTab from '@/components/admin/shipping/ShipmentsTab'
import CountriesTab from '@/components/admin/shipping/CountriesTab'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

const TABS = [
  { id: 'countries', label: 'Countries' },
  { id: 'methods', label: 'Shipping Methods' },
  { id: 'rates', label: 'Shipping Rates' },
  { id: 'rules', label: 'Free Shipping Rules' },
  { id: 'shipments', label: 'Shipments' },
]

export default function AdminShippingPage() {
  const { ta } = useAdminTranslate()
  const [activeTab, setActiveTab] = useState('methods')

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">{ta('Shipping Management')}</h1>
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
      {activeTab === 'countries' && <CountriesTab />}
      {activeTab === 'methods' && <MethodsTab />}
      {activeTab === 'rates' && <RatesTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'shipments' && <ShipmentsTab />}
    </div>
  )
}
