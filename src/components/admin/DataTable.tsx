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
import { TableSkeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { useMediaQuery } from '@/hooks/useMediaQuery'

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
  responsiveCards?: boolean
}

export function DataTable<T extends Record<string, any>>({
  columns, data, loading = false, onRowClick,
  selectable = false, selectedIds = new Set(), onSelectionChange,
  keyExtractor, emptyTitle, emptyDescription, emptyAction, responsiveCards,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const isMobile = useMediaQuery('(max-width: 767px)')

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
      <div className="bg-card rounded-xl border-border overflow-hidden p-4">
        <TableSkeleton rows={8} cols={columns.length + (selectable ? 1 : 0)} />
      </div>
    )
  }

  if (isMobile && responsiveCards && !loading && data.length > 0) {
    return (
      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`bg-card rounded-xl border-border p-4 space-y-2 ${onRowClick ? 'cursor-pointer hover:border-gold/30 transition-colors' : ''}`}
          >
            {columns.map((col) => {
              const cellValue = 'accessorKey' in col
                ? String(col.accessorKey!.split('.').reduce((obj: any, key: string) => obj?.[key], item) ?? '')
                : ''
              return (
                <div key={String(col.id || col.header)} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">{typeof col.header === 'string' ? col.header : ''}</span>
                  <span className="text-foreground font-medium">{cellValue}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0 && emptyTitle) {
    return (
      <div className="bg-card rounded-xl border-border">
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl border-border overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">No data found</div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 select-none ${
                      header.column.getCanSort() ? 'cursor-pointer hover:text-foreground' : ''
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
                            <ChevronsUpDown className="h-3 w-3 text-muted" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/50">
            {table.getRowModel().rows.map(row => (
              <tr
                key={keyExtractor(row.original)}
                onClick={() => onRowClick?.(row.original)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} transition-colors`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-foreground">
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
