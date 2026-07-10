'use client'

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' },
  published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Published' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
  unpaid: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Unpaid' },
  refunded: { bg: 'bg-red-100', text: 'text-red-800', label: 'Refunded' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
