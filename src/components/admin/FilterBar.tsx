'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type FilterOption = { label: string; value: string }

type FilterBarProps = {
  status?: string
  onStatusChange?: (v: string) => void
  statusOptions?: FilterOption[]
  dateFrom?: string
  dateTo?: string
  onDateFromChange?: (v: string) => void
  onDateToChange?: (v: string) => void
  source?: string
  onSourceChange?: (v: string) => void
  sourceOptions?: FilterOption[]
  children?: React.ReactNode
  onClearAll?: () => void
  hasActiveFilters?: boolean
}

export function FilterBar({
  status, onStatusChange, statusOptions = [],
  dateFrom, dateTo, onDateFromChange, onDateToChange,
  source, onSourceChange, sourceOptions = [],
  children,
  onClearAll, hasActiveFilters = false,
}: FilterBarProps) {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-xl border-border">
      {statusOptions.length > 0 && onStatusChange && (
        <select
          value={status || ''}
          onChange={e => onStatusChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{ta('All Statuses')}</option>
          {statusOptions.map(o => (
            <option key={o.value} value={o.value}>{ta(o.label)}</option>
          ))}
        </select>
      )}

      {onDateFromChange && (
        <input
          type="date"
          value={dateFrom || ''}
          onChange={e => onDateFromChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={ta('From')}
        />
      )}

      {onDateToChange && (
        <input
          type="date"
          value={dateTo || ''}
          onChange={e => onDateToChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={ta('To')}
        />
      )}

      {sourceOptions.length > 0 && onSourceChange && (
        <select
          value={source || ''}
          onChange={e => onSourceChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{ta('All Sources')}</option>
          {sourceOptions.map(o => (
            <option key={o.value} value={o.value}>{ta(o.label)}</option>
          ))}
        </select>
      )}

      {children}

      {hasActiveFilters && onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-destructive hover:text-destructive/80">
          <X className="h-3 w-3 mr-1" />
          {ta('Clear all')}
        </Button>
      )}
    </div>
  )
}
