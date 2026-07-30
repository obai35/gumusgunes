'use client'

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Processing' },
  shipped: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Shipped' },
  delivered: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Delivered' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Cancelled' },
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Active' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Inactive' },
  draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Draft' },
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Scheduled' },
  published: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Published' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Failed' },
  paid: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Paid' },
  unpaid: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Unpaid' },
  refunded: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Refunded' },
}

const defaultConfig = { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Unknown' }

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status.toLowerCase()] || { ...defaultConfig, label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
