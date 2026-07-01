'use client'

type Props = {
  assessmentData: any
  loading: boolean
  onBack: () => void
}

export default function AssessmentView({ assessmentData, loading, onBack }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 text-sm text-white/50">Loading...</div>
    )
  }

  if (!assessmentData) {
    return (
      <div className="flex items-center justify-center flex-1 text-sm text-white/50">No assessment data available</div>
    )
  }

  const summary = assessmentData.summary
  const orders = assessmentData.orders || []
  const returns = assessmentData.returns || []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <h1 className="font-display text-lg font-semibold text-silver-soft">Shift Assessment</h1>
        <button onClick={onBack} className="px-4 py-2 bg-gradient-to-r from-gold/90 to-gold text-navy-deep rounded-lg text-sm font-bold hover:from-gold hover:to-gold/90 transition-all shadow-lg shadow-gold/20">
          Back to POS
        </button>
      </div>
      <div className="space-y-6 overflow-y-auto flex-1 scroll-luxury">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: summary?.totalOrders || orders.length || 0, color: 'text-gold' },
            { label: 'Total Revenue', value: summary ? `$${(summary.totalRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-gold' },
            { label: 'Cash Revenue', value: summary ? `$${(summary.cashRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-emerald-400' },
            { label: 'Card Revenue', value: summary ? `$${(summary.cardRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="pos-glass rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {summary?.splitRevenue !== undefined && (
            <div className="pos-glass rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Split Revenue</p>
              <p className="text-2xl font-bold text-gold">${summary.splitRevenue.toFixed(2)}</p>
            </div>
          )}
          {summary?.totalReturns !== undefined && (
            <div className="pos-glass rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Returns</p>
              <p className="text-2xl font-bold text-red-400">-${summary.totalReturns.toFixed(2)}</p>
            </div>
          )}
          {summary?.netRevenue !== undefined && (
            <div className="pos-glass rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Net Revenue</p>
              <p className="text-2xl font-bold text-emerald-400">${summary.netRevenue.toFixed(2)}</p>
            </div>
          )}
        </div>

        {summary?.averageOrder !== undefined && (
          <div className="pos-glass rounded-xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Average Order Value</p>
            <p className="text-2xl font-bold text-gold">${summary.averageOrder.toFixed(2)}</p>
          </div>
        )}

        {returns.length > 0 && (
          <div className="pos-glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-silver-soft mb-3">Returns</h3>
            <div className="space-y-2">
              {returns.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                  <div>
                    <p className="font-medium text-silver-soft">{r.returnNumber}</p>
                    <p className="text-xs text-white/40">{r.reason.replace(/_/g, ' ')} — {r.refundMethod.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-400">-${r.refundAmount.toFixed(2)}</p>
                    <p className="text-xs text-white/40">{r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary?.topProducts?.length > 0 && (
          <div className="pos-glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-silver-soft mb-3">Top Selling Products</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.topProducts.map((p: any, i: number) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 text-silver-soft font-medium">{p.name || p.productName}</td>
                    <td className="py-2 text-right text-white/50">{p.quantity || p.qty}</td>
                    <td className="py-2 text-right text-silver-soft font-medium">${(p.revenue || p.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orders.length > 0 && (
          <div className="pos-glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-silver-soft mb-3">Recent Orders</h3>
            <div className="space-y-2">
              {orders.slice(0, 10).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                  <div>
                    <p className="font-medium text-silver-soft">#{order.receiptNumber || order.orderNumber || order.id?.slice(0, 8)}</p>
                    <p className="text-xs text-white/40">{order.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-silver-soft">${(order.total || 0).toFixed(2)}</p>
                    <p className="text-xs text-white/40">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
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
