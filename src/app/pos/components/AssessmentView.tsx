'use client'

type Props = {
  assessmentData: any
  loading: boolean
  onBack: () => void
}

export default function AssessmentView({ assessmentData, loading, onBack }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">Loading...</div>
    )
  }

  if (!assessmentData) {
    return (
      <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">No assessment data available</div>
    )
  }

  const summary = assessmentData.summary
  const orders = assessmentData.orders || []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h1 className="font-display text-lg font-semibold text-navy">Shift Assessment</h1>
        <button onClick={onBack} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          Back to POS
        </button>
      </div>
      <div className="space-y-6 overflow-y-auto flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: summary?.totalOrders || orders.length || 0, color: 'text-navy' },
            { label: 'Total Revenue', value: summary ? `$${(summary.totalRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-navy' },
            { label: 'Cash Revenue', value: summary ? `$${(summary.cashRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-green-600' },
            { label: 'Card Revenue', value: summary ? `$${(summary.cardRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {summary?.splitRevenue !== undefined && (
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Split Revenue</p>
            <p className="text-2xl font-bold text-navy">${summary.splitRevenue.toFixed(2)}</p>
          </div>
        )}

        {summary?.averageOrderValue !== undefined && (
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Average Order Value</p>
            <p className="text-2xl font-bold text-navy">${summary.averageOrderValue.toFixed(2)}</p>
          </div>
        )}

        {summary?.topProducts?.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Top Selling Products</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.topProducts.map((p: any, i: number) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-navy font-medium">{p.name || p.productName}</td>
                    <td className="py-2 text-right text-muted-foreground">{p.quantity || p.qty}</td>
                    <td className="py-2 text-right text-navy font-medium">${(p.revenue || p.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orders.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Recent Orders</h3>
            <div className="space-y-2">
              {orders.slice(0, 10).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                  <div>
                    <p className="font-medium text-navy">#{order.receiptNumber || order.orderNumber || order.id?.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-navy">${(order.total || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
