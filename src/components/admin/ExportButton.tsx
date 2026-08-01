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
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type ExportColumn = { header: string; key: string; width?: number }

type ExportButtonProps = {
  filename: string
  columns: ExportColumn[]
  data: Record<string, any>[]
  label?: string
}

export function ExportButton({ filename, columns, data, label = 'Export' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const { ta } = useAdminTranslate()

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
          {exporting ? ta('Exporting...') : ta(label)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>{ta('Export as CSV')}</DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel}>{ta('Export as Excel')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
