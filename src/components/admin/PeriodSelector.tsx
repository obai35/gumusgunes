'use client'

import { Calendar } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export type Period = 'today' | 'week' | 'month' | 'custom'

type PeriodSelectorProps = {
  value: Period
  onChange: (p: Period) => void
  dateFrom?: string
  dateTo?: string
  onDateRangeChange?: (from: string, to: string) => void
}

const options: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
]

export function PeriodSelector({ value, onChange, dateFrom, dateTo, onDateRangeChange }: PeriodSelectorProps) {
  const { ta } = useAdminTranslate()
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              value === opt.value ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {ta(opt.label)}
          </button>
        ))}
      </div>
      {value === 'custom' && onDateRangeChange && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom || ''}
            onChange={e => onDateRangeChange(e.target.value, dateTo || '')}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="date"
            value={dateTo || ''}
            onChange={e => onDateRangeChange(dateFrom || '', e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
          />
        </div>
      )}
    </div>
  )
}
