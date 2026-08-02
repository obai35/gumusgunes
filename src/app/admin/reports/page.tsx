'use client'

import { useState } from 'react'
import { ErrorBoundary } from '@/components/admin/ErrorBoundary'
import { BarChart3 } from 'lucide-react'
import CustomReportBuilder from './CustomReportBuilder'
import PlCategoryTab from './PlCategoryTab'
import CustomerLTVTab from './CustomerLTVTab'
import SalesHeatmapTab from './SalesHeatmapTab'
import InventoryValuationTab from './InventoryValuationTab'
import MarginAnalysisTab from './MarginAnalysisTab'
import YoYComparisonTab from './YoYComparisonTab'
import ForecastingTab from './ForecastingTab'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

const TABS = [
  { key: 'custom-report', label: 'Custom Report', icon: BarChart3 },
  { key: 'pl-category', label: 'P&L by Category', icon: BarChart3 },
  { key: 'customer-ltv', label: 'Customer LTV', icon: BarChart3 },
  { key: 'sales-heatmap', label: 'Sales Heatmap', icon: BarChart3 },
  { key: 'inventory-valuation', label: 'Inventory Valuation', icon: BarChart3 },
  { key: 'margin-analysis', label: 'Margin Analysis', icon: BarChart3 },
  { key: 'yoy-comparison', label: 'YoY Comparison', icon: BarChart3 },
  { key: 'forecasting', label: 'Forecasting', icon: BarChart3 },
]

export default function ReportsPage() {
  const { ta } = useAdminTranslate()
  const [tab, setTab] = useState('custom-report')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-navy">{ta('Reporting & Analytics')}</h1>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${
              tab === t.key ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'
            }`}
          >
            {ta(t.label)}
          </button>
        ))}
      </div>

      <ErrorBoundary>
        {tab === 'custom-report' && <CustomReportBuilder />}
        {tab === 'pl-category' && <PlCategoryTab />}
        {tab === 'customer-ltv' && <CustomerLTVTab />}
        {tab === 'sales-heatmap' && <SalesHeatmapTab />}
        {tab === 'inventory-valuation' && <InventoryValuationTab />}
        {tab === 'margin-analysis' && <MarginAnalysisTab />}
        {tab === 'yoy-comparison' && <YoYComparisonTab />}
        {tab === 'forecasting' && <ForecastingTab />}
      </ErrorBoundary>
    </div>
  )
}
