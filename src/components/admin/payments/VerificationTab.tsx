'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { SearchInput } from '@/components/admin/SearchInput'
import { ExportButton } from '@/components/admin/ExportButton'
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

type Order = {
  id: string
  orderNumber: string
  fullName: string
  totalAmount: number
  paymentMethod: string
  paymentReference: string | null
  walletProvider: string | null
  createdAt: string
  notes: string | null
}

export default function VerificationTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/payments/verifications?${params}`)
    if (res.ok) {
      const d = await res.json()
      setOrders(Array.isArray(d.orders) ? d.orders : [])
      setTotal(d.total)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => { setPage(1) }, [search])

  async function handleVerify(orderId: string) {
    const res = await fetch('/api/admin/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    if (res.ok) { toast.success('Payment verified'); fetchOrders() }
    else toast.error('Failed to verify')
  }

  function handleRejectClick(orderId: string) {
    setRejectOrderId(orderId)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  async function handleRejectConfirm() {
    if (!rejectOrderId) return
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    const res = await fetch('/api/admin/payments/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: rejectOrderId, reason: rejectReason }),
    })
    if (res.ok) {
      toast.success('Payment rejected')
      setRejectOrderId(null)
      setRejectReason('')
      setRejectDialogOpen(false)
      fetchOrders()
    } else {
      toast.error('Failed to reject')
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order Number',
    },
    {
      accessorKey: 'fullName',
      header: 'Customer Name',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => `E£${row.original.totalAmount.toFixed(2)}`,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment Method',
    },
    {
      id: 'walletInfo',
      header: 'Wallet / Reference',
      cell: ({ row }) => {
        const o = row.original
        const parts: string[] = []
        if (o.walletProvider) parts.push(o.walletProvider)
        if (o.paymentReference) parts.push(`Ref: ${o.paymentReference}`)
        return parts.length ? parts.join(' \u2014 ') : '\u2014'
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleVerify(row.original.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            onClick={() => handleRejectClick(row.original.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
          >
            <XCircle className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      ),
    },
  ]

  const exportColumns = [
    { header: 'Order Number', key: 'orderNumber' },
    { header: 'Customer Name', key: 'fullName' },
    { header: 'Total Amount', key: 'totalAmount' },
    { header: 'Payment Method', key: 'paymentMethod' },
    { header: 'Wallet Provider', key: 'walletProvider' },
    { header: 'Payment Reference', key: 'paymentReference' },
    { header: 'Date', key: 'createdAt' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search orders..." className="w-72" />
          <p className="text-sm text-muted-foreground">{total} orders awaiting verification</p>
        </div>
        <ExportButton
          filename="payment-verifications"
          columns={exportColumns}
          data={orders}
        />
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        keyExtractor={(o) => o.id}
        emptyTitle="No pending verifications"
        emptyDescription="All payment verifications have been processed."
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting this payment verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-24"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRejectConfirm()
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
