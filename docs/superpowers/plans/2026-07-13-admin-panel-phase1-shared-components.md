# Admin Panel Phase 1: Shared Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the shared component library that all admin tabs will use — enhanced DataTable, FilterBar, ActionMenu, EmptyState, BulkActionBar, ExportButton, ConfirmDialog, keyboard shortcuts, and improvements to existing Pagination, SearchInput, StatsCard, ErrorBoundary, and AdminShell.

**Architecture:** Enhance existing components where they already exist (DataTable, Pagination, SearchInput, StatsCard, ErrorBoundary, Skeleton, AdminShell, PageHeader). Create new standalone components (FilterBar, ActionMenu, EmptyState, BulkActionBar, ExportButton, ConfirmDialog, useKeyboardShortcuts). Use shadcn/ui primitives (Sheet, DropdownMenu, AlertDialog, Sonner) and existing deps (@tanstack/react-table, recharts, lucide, framer-motion, date-fns).

**Tech Stack:** Next.js 16, shadcn/ui, @tanstack/react-table, framer-motion, lucide-react, date-fns, exceljs, sonner

---

### Task 1: Create `useDebounce` hook

**Files:**
- Create: `src/hooks/useDebounce.ts`

- [ ] **Step 1: Create `useDebounce` hook**

```ts
'use client'

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
```

- [ ] **Step 2: Enhance SearchInput to use debounce**

In `src/components/admin/SearchInput.tsx`:
- Add `debounceMs?: number` prop (default 300)
- Internally use `useDebounce(value, debounceMs)` and call `onChange(debouncedValue)` only when debounced value changes
- Keep the immediate display value in the input so it feels responsive
- Actually, simpler approach: keep the current input behavior (immediate display) but debounce the `onChange` callback

Better approach: Add `useEffect` inside SearchInput that calls `onChange` with debounced value.

```tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value, onChange, placeholder = 'Search...', debounceMs = 300, className = ''
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, debounceMs)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onChange(debouncedValue)
  }, [debouncedValue, onChange])

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      />
      {localValue && (
        <button onClick={() => { setLocalValue(''); onChange('') }} className="absolute right-3 top-1/2 -translate-y-1/2">
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDebounce.ts src/components/admin/SearchInput.tsx
git commit -m "feat: add useDebounce hook and enhance SearchInput with debounce support"
```

---

### Task 2: Create `useDataFetching` hook

**Files:**
- Create: `src/hooks/useDataFetching.ts`

Standardizes the loading/error/data/empty pattern across all admin pages.

- [ ] **Step 1: Create the hook**

```ts
'use client'

import { useState, useEffect, useCallback } from 'react'

type UseDataFetchingResult<T> = {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDataFetching<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
): UseDataFetchingResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refresh: fetch }
}
```

- [ ] **Step 2: Add test**

Create `src/hooks/useDataFetching.test.ts`. Note: existing test pattern uses plain `*.test.ts` with what appears to be vitest.

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDataFetching } from './useDataFetching'

describe('useDataFetching', () => {
  it('should return loading initially', () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useDataFetching(fetcher))
    expect(result.current.loading).toBe(true)
  })

  it('should return data after fetch succeeds', async () => {
    const fetcher = vi.fn().mockResolvedValue('hello')
    const { result } = renderHook(() => useDataFetching(fetcher))
    await waitFor(() => expect(result.current.data).toBe('hello'))
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should return error on fetch failure', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('oops'))
    const { result } = renderHook(() => useDataFetching(fetcher))
    await waitFor(() => expect(result.current.error).toBe('oops'))
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
  })

  it('should refresh data when refresh is called', async () => {
    let count = 0
    const fetcher = vi.fn().mockResolvedValue('refreshed')
    const { result } = renderHook(() => useDataFetching(fetcher))
    await waitFor(() => expect(result.current.data).toBe('refreshed'))
    result.current.refresh()
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDataFetching.ts src/hooks/useDataFetching.test.ts
git commit -m "feat: add useDataFetching hook with loading/error/data state management"
```

---

### Task 3: Enhance Pagination with page size selector

**Files:**
- Modify: `src/components/admin/Pagination.tsx`

- [ ] **Step 1: Enhance the component**

```tsx
'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  page: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function Pagination({
  page, totalPages, totalItems, pageSize = 20, onPageChange, onPageSizeChange
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-500">
          {totalItems !== undefined && (
            <>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}</>
          )}
          {totalItems === undefined && <>Page {page} of {totalPages}</>}
        </p>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4))
          const p = start + i
          if (p > totalPages) return null
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/Pagination.tsx
git commit -m "feat: enhance Pagination with page size selector and total items display"
```

---

### Task 4: Enhance StatsCard with trend indicator

**Files:**
- Modify: `src/components/admin/StatsCard.tsx`

- [ ] **Step 1: Enhance the component**

```tsx
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import type { ReactNode } from 'react'

type StatsCardProps = {
  icon: LucideIcon
  label: string
  value: string
  sub?: ReactNode
  trend?: { value: number; positive: boolean }
  onClick?: () => void
}

export function StatsCard({ icon: Icon, label, value, sub, trend, onClick }: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-border p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="h-12 w-12 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6 text-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-navy">{value}</p>
          {trend && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/StatsCard.tsx
git commit -m "feat: enhance StatsCard with trend indicator and clickability"
```

---

### Task 5: Enhance ErrorBoundary and AdminShell for responsive

**Files:**
- Modify: `src/components/admin/ErrorBoundary.tsx`
- Modify: `src/components/admin/AdminShell.tsx`

- [ ] **Step 1: Enhance ErrorBoundary with retry without full reload**

```tsx
'use client'

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode; onRetry?: () => void }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4">{this.state.error?.message}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-navy text-silver rounded-lg text-sm hover:bg-navy/90 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: Enhance AdminShell to use shadcn Sheet for mobile sidebar**

```tsx
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { AdminAuthGuard } from './AdminAuthGuard'
import { Menu } from 'lucide-react'
import { PageTransition } from '@/components/ui/PageTransition'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AdminAuthGuard>
      {isLogin ? (
        <>{children}</>
      ) : (
        <div className="flex min-h-screen bg-gray-50">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile sidebar as Sheet */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          <main className="flex-1 p-6 overflow-auto min-w-0">
            <div className="lg:hidden mb-4">
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  Menu
                </Button>
              </SheetTrigger>
            </div>
            <AnimatePresence mode="wait">
              <PageTransition key={pathname}>
                {children}
              </PageTransition>
            </AnimatePresence>
          </main>
        </div>
      )}
    </AdminAuthGuard>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ErrorBoundary.tsx src/components/admin/AdminShell.tsx
git commit -m "feat: enhance ErrorBoundary with retry callback and AdminShell with shadcn Sheet for mobile"
```

---

### Task 6: Create FilterBar component

**Files:**
- Create: `src/components/admin/FilterBar.tsx`

- [ ] **Step 1: Create FilterBar**

```tsx
'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
      {statusOptions.length > 0 && onStatusChange && (
        <select
          value={status || ''}
          onChange={e => onStatusChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Statuses</option>
          {statusOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {onDateFromChange && (
        <input
          type="date"
          value={dateFrom || ''}
          onChange={e => onDateFromChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="From"
        />
      )}

      {onDateToChange && (
        <input
          type="date"
          value={dateTo || ''}
          onChange={e => onDateToChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="To"
        />
      )}

      {sourceOptions.length > 0 && onSourceChange && (
        <select
          value={source || ''}
          onChange={e => onSourceChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Sources</option>
          {sourceOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {children}

      {hasActiveFilters && onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-red-500 hover:text-red-700">
          <X className="h-3 w-3 mr-1" />
          Clear all
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/FilterBar.tsx
git commit -m "feat: create FilterBar component with status, date, and source filters"
```

---

### Task 7: Create ActionMenu component

**Files:**
- Create: `src/components/admin/ActionMenu.tsx`

- [ ] **Step 1: Create ActionMenu using shadcn DropdownMenu**

```tsx
'use client'

import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Action = {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

type ActionMenuProps = {
  actions: Action[]
  label?: string
}

export function ActionMenu({ actions, label = 'Actions' }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {actions.map((action, i) => {
          if (action.label === 'separator') {
            return <DropdownMenuSeparator key={`sep-${i}`} />
          }
          return (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
            >
              {action.icon && <span className="mr-2 h-4 w-4">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/ActionMenu.tsx
git commit -m "feat: create ActionMenu component using shadcn DropdownMenu"
```

---

### Task 8: Create EmptyState and BulkActionBar components

**Files:**
- Create: `src/components/admin/EmptyState.tsx`
- Create: `src/components/admin/BulkActionBar.tsx`

- [ ] **Step 1: Create EmptyState**

```tsx
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon || <Inbox className="h-8 w-8 text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create BulkActionBar**

```tsx
'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

type BulkAction = {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline'
}

type BulkActionBarProps = {
  selectedCount: number
  actions: BulkAction[]
  onClear: () => void
}

export function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 bg-navy text-white px-5 py-3 rounded-full shadow-lg">
          <span className="text-sm font-medium whitespace-nowrap">{selectedCount} selected</span>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            {actions.map(action => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                onClick={action.onClick}
                className="text-xs h-7"
              >
                {action.label}
              </Button>
            ))}
          </div>
          <div className="h-4 w-px bg-white/20" />
          <button onClick={onClear} className="text-white/60 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/EmptyState.tsx src/components/admin/BulkActionBar.tsx
git commit -m "feat: create EmptyState and BulkActionBar components"
```

---

### Task 9: Create ExportButton component

**Files:**
- Create: `src/components/admin/ExportButton.tsx`

- [ ] **Step 1: Create ExportButton**

```tsx
'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import * as XLSX from 'exceljs'

type ExportColumn = { header: string; key: string; width?: number }

type ExportButtonProps = {
  filename: string
  columns: ExportColumn[]
  data: Record<string, any>[]
  label?: string
}

export function ExportButton({ filename, columns, data, label = 'Export' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const exportCSV = async () => {
    setExporting(true)
    try {
      const workbook = new XLSX.Workbook()
      const sheet = workbook.addWorksheet('Sheet1')
      sheet.columns = columns.map(c => ({ header: c.header, key: c.key, width: c.width || 20 }))
      data.forEach(row => sheet.addRow(row))
      const csvBuffer = await workbook.csv.writeBuffer()
      const blob = new Blob([csvBuffer], { type: 'text/csv;charset=utf-8;' })
      downloadBlob(blob, `${filename}.csv`)
    } finally {
      setExporting(false)
    }
  }

  const exportExcel = async () => {
    setExporting(true)
    try {
      const workbook = new XLSX.Workbook()
      const sheet = workbook.addWorksheet('Sheet1')
      sheet.columns = columns.map(c => ({ header: c.header, key: c.key, width: c.width || 20 }))
      data.forEach(row => {
        const excelRow = sheet.addRow(row)
        excelRow.eachCell(cell => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } } })
      })
      sheet.getRow(1).font = { bold: true }
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      downloadBlob(blob, `${filename}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel}>Export as Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/ExportButton.tsx
git commit -m "feat: create ExportButton with CSV and Excel export via exceljs"
```

---

### Task 10: Create ConfirmDialog component

**Files:**
- Create: `src/components/admin/ConfirmDialog.tsx`

- [ ] **Step 1: Create ConfirmDialog using shadcn AlertDialog**

```tsx
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  destructive?: boolean
}

export function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, destructive = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/ConfirmDialog.tsx
git commit -m "feat: create ConfirmDialog using shadcn AlertDialog"
```

---

### Task 11: Create `useKeyboardShortcuts` hook

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: Create the hook**

```ts
'use client'

import { useEffect } from 'react'

type ShortcutDef = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  handler: (e: KeyboardEvent) => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[], enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const listener = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const ctrl = s.ctrl ?? false
        const meta = s.meta ?? false
        const shift = s.shift ?? false
        const matchCtrl = ctrl ? (e.ctrlKey || e.metaKey) : true
        const matchMeta = meta ? e.metaKey : true
        const matchShift = shift ? e.shiftKey : true
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase()

        if (matchKey && matchCtrl && matchMeta && matchShift) {
          e.preventDefault()
          s.handler(e)
          return
        }
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [shortcuts, enabled])
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts
git commit -m "feat: add useKeyboardShortcuts hook for keyboard navigation"
```

---

### Task 12: Enhance DataTable with @tanstack/react-table, selection, sorting

**Files:**
- Modify: `src/components/admin/DataTable.tsx`

- [ ] **Step 1: Enhance DataTable**

```tsx
'use client'

import { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton, TableSkeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

type DataTableProps<T extends Record<string, any>> = {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (item: T) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  keyExtractor: (item: T) => string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
}

export function DataTable<T extends Record<string, any>>({
  columns, data, loading = false, onRowClick,
  selectable = false, selectedIds = new Set(), onSelectionChange,
  keyExtractor, emptyTitle, emptyDescription, emptyAction,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const allColumns = useMemo(() => {
    const cols: ColumnDef<T>[] = []
    if (selectable) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onCheckedChange={(v) => {
              const allIds = v ? new Set(data.map(keyExtractor)) : new Set<string>()
              onSelectionChange?.(allIds)
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(keyExtractor(row.original))}
            onCheckedChange={(v) => {
              const next = new Set(selectedIds)
              const id = keyExtractor(row.original)
              if (v) next.add(id)
              else next.delete(id)
              onSelectionChange?.(next)
            }}
            aria-label={`Select row ${keyExtractor(row.original)}`}
          />
        ),
        size: 40,
      })
    }
    cols.push(...columns)
    return cols
  }, [columns, selectable, selectedIds, data, keyExtractor, onSelectionChange])

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: false,
  })

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden p-4">
        <TableSkeleton rows={8} cols={columns.length + (selectable ? 1 : 0)} />
      </div>
    )
  }

  if (data.length === 0 && emptyTitle) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-8 text-center text-gray-400">No data found</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-100 bg-gray-50/50">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 select-none ${
                      header.column.getCanSort() ? 'cursor-pointer hover:text-gray-700' : ''
                    }`}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="inline-flex flex-col">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-gray-300" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {table.getRowModel().rows.map(row => (
              <tr
                key={keyExtractor(row.original)}
                onClick={() => onRowClick?.(row.original)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/DataTable.tsx
git commit -m "feat: enhance DataTable with @tanstack/react-table, sorting, checkbox selection, skeleton loading, empty state"
```

---

## Plan Self-Review

**Spec coverage:** All shared components from the design spec are covered — DataTable (enhanced), Pagination (enhanced), SearchInput (enhanced), StatsCard (enhanced), ErrorBoundary (enhanced), AdminShell (enhanced), FilterBar (new), ActionMenu (new), EmptyState (new), BulkActionBar (new), ExportButton (new), ConfirmDialog (new), useKeyboardShortcuts (new). The only components deferred are hooks (useDataFetching, useDebounce) which are created here. PageHeader needs no enhancements beyond what it already has (breadcrumbs slot could be added later).

**Placeholder scan:** Clean — every step has complete code.

**Type consistency:** All type names, prop interfaces, and method signatures are consistent between dependencies across tasks.

**Gaps identified and filled:**
- No existing useDebounce hook → Task 1 creates it
- No existing useDataFetching hook → Task 2 creates it
- Existing DataTable didn't use @tanstack/react-table or support selection → Task 12 covers this
- AdminShell used inline overlay instead of shadcn Sheet → Task 5 switches to Sheet
