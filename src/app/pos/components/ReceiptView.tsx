'use client'

import { Printer, DollarSign, CreditCard } from 'lucide-react'
import type { ReceiptData } from '../types'

type Props = {
  receipt: ReceiptData
  onNewSale: () => void
  isOffline?: boolean
}

export default function ReceiptView({ receipt, onNewSale, isOffline }: Props) {

  function printReceipt() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>Receipt</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
          .text-center { text-align: center; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .border-b { border-bottom: 1px dashed #ccc; }
          .border-t { border-top: 1px dashed #ccc; }
          .p-4 { padding: 16px; }
          .mb-2 { margin-bottom: 8px; }
          .text-lg { font-size: 18px; }
          .text-sm { font-size: 13px; }
          .text-xs { font-size: 11px; }
          .font-bold { font-weight: bold; }
          .mt-2 { margin-top: 8px; }
          img { width: 32px; height: 32px; border-radius: 50%; }
          @media print { @page { margin: 8mm; } }
        </style></head>
        <body>
          <div class="text-center">
            <img src="/gumusgunes-logo.jpeg" alt="" style="margin:0 auto 8px" />
            <p style="font-size:18px;font-weight:600">Gümüş Güneş</p>
            <p class="text-xs">In-store Purchase</p>
            <p class="text-sm font-bold mt-2">${receipt.receiptNumber}</p>
            <p class="text-xs">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div class="border-b p-4">
            ${receipt.items.map((item) => `
              <div class="flex justify-between text-sm">
                <div>
                  <p class="font-bold">${item.product.name}</p>
                  <p class="text-xs">${item.product.sku} × ${item.quantity}</p>
                </div>
                <span class="font-bold">E£${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="p-4">
            <div class="flex justify-between text-sm"><span>Subtotal</span><span>E£${receipt.subtotal.toFixed(2)}</span></div>
            ${receipt.discount > 0 ? `<div class="flex justify-between text-sm"><span>Discount</span><span>-E£${receipt.discount.toFixed(2)}</span></div>` : ''}
            <div class="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Total</span><span>E£${receipt.total.toFixed(2)}</span></div>
          </div>
          <div class="p-4" style="background:#f9f9f9">
            <p class="text-xs font-bold" style="text-transform:uppercase">Payment</p>
            ${receipt.paymentMethod === 'cash' ? `<div class="flex justify-between text-sm"><span>Cash</span><span class="font-bold">E£${receipt.total.toFixed(2)}</span></div>` : ''}
            ${receipt.paymentMethod === 'card' ? `<div class="flex justify-between text-sm"><span>Card</span><span class="font-bold">E£${receipt.total.toFixed(2)}</span></div>` : ''}
            ${receipt.paymentMethod === 'split' ? `
              <div class="flex justify-between text-sm"><span>Cash</span><span class="font-bold">E£${(receipt.cashAmount || 0).toFixed(2)}</span></div>
              <div class="flex justify-between text-sm"><span>Card</span><span class="font-bold">E£${(receipt.cardAmount || 0).toFixed(2)}</span></div>
            ` : ''}
          </div>
          <p class="text-center text-xs" style="margin-top:16px">Thank you for your purchase!</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="flex items-start justify-center min-h-[60vh] pt-8" id="pos-receipt">
      <div className={'pos-glass-strong rounded-xl w-full max-w-sm relative overflow-hidden ' + (isOffline ? 'ring-1 ring-amber-500/30' : '')}>
        {isOffline && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-md text-amber-400 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_12px_-4px_rgba(251,191,36,0.3)]">
            Offline
          </div>
        )}
        <div className="text-center p-6 border-b border-dashed border-white/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-gold/40">
              <img src="/gumusgunes-logo.jpeg" alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-lg font-semibold text-silver-soft">Gümüş <span className="gold-text">Güneş</span></span>
          </div>
          <p className="text-xs text-white/50">In-store Purchase</p>
          <p className="text-sm font-bold text-gold font-mono mt-2 tracking-wider">{receipt.receiptNumber}</p>
          <p className="text-xs text-white/40">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="p-4 space-y-2 border-b border-dashed border-white/10">
          {receipt.items.map((item, i) => (
            <div key={item.id || i} className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0 mr-2">
                <p className="font-medium text-silver-soft truncate">{item.product.name}</p>
                <p className="text-xs text-white/40 font-mono">{item.product.sku} × {item.quantity}</p>
              </div>
              <span className="font-medium text-silver-soft whitespace-nowrap">E£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="p-4 space-y-1 border-b border-dashed border-white/10">
          <div className="flex justify-between text-sm text-white/40"><span>Subtotal</span><span>E£{receipt.subtotal.toFixed(2)}</span></div>
          {receipt.discount > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Discount</span><span>-E£{receipt.discount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-lg font-bold text-gold pt-1 border-t border-white/10"><span>Total</span><span>E£{receipt.total.toFixed(2)}</span></div>
        </div>
        <div className="p-4 space-y-1 border-b border-dashed border-white/10 bg-white/5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Payment</p>
          {receipt.paymentMethod === 'cash' && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Cash</span>
              <span className="font-medium text-silver-soft">E£{receipt.total.toFixed(2)}</span>
            </div>
          )}
          {receipt.paymentMethod === 'card' && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-blue-400" /> Card</span>
              <span className="font-medium text-silver-soft">E£{receipt.total.toFixed(2)}</span>
            </div>
          )}
          {receipt.paymentMethod === 'split' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Cash</span>
                <span className="font-medium text-silver-soft">E£{(receipt.cashAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-blue-400" /> Card</span>
                <span className="font-medium text-silver-soft">E£{(receipt.cardAmount || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        <div className="p-4 space-y-2">
          <button onClick={printReceipt} className="w-full px-6 py-2.5 border border-white/10 rounded-lg text-sm text-silver-soft font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2">
            <Printer className="h-4 w-4" /> Print Receipt
          </button>
          <button onClick={onNewSale} className="w-full px-6 py-2.5 bg-gradient-to-r from-gold/90 to-gold text-navy-deep rounded-lg text-sm font-bold hover:from-gold hover:to-gold/90 transition-all shadow-lg shadow-gold/20">New Sale</button>
        </div>
      </div>
    </div>
  )
}
