'use client'

import { useEffect, useRef } from 'react'

interface ReturnReceiptProps {
  returnData: {
    returnNumber: string
    reason: string
    refundMethod: string
    refundAmount: number
    createdAt: string
    notes?: string
    items: Array<{
      product: { name: string }
      quantity: number
      refundAmount: number
    }>
    order: { receiptNumber: string }
    processedBy: { name: string }
  }
  branchName: string
  onClose: () => void
}

export default function ReturnReceipt({ returnData, branchName, onClose }: ReturnReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const printedRef = useRef(false)

  useEffect(() => {
    if (!printedRef.current) {
      printedRef.current = true
      setTimeout(() => {
        window.print()
      }, 300)
    }
  }, [])

  const date = new Date(returnData.createdAt).toLocaleString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-white">
      <div ref={receiptRef} className="bg-white text-black p-6 rounded-xl shadow-2xl max-w-sm w-full print:shadow-none print:rounded-none print:p-4">
        <div className="text-center border-b border-gray-300 pb-4 mb-4">
          <h1 className="text-lg font-bold uppercase tracking-wide">Return Receipt</h1>
          <p className="text-sm">{branchName}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>

        <div className="text-xs space-y-1 mb-4">
          <p><span className="font-semibold">Return #:</span> {returnData.returnNumber}</p>
          <p><span className="font-semibold">Original Receipt:</span> #{returnData.order.receiptNumber}</p>
          <p><span className="font-semibold">Reason:</span> {returnData.reason.replace(/_/g, ' ')}</p>
        </div>

        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left pb-1 font-semibold">Item</th>
              <th className="text-center pb-1 font-semibold">Qty</th>
              <th className="text-right pb-1 font-semibold">Refund</th>
            </tr>
          </thead>
          <tbody>
            {returnData.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-1">{item.product.name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">E£{item.refundAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right text-sm font-bold border-t border-gray-300 pt-2 mb-6">
          Total Refund: E£{returnData.refundAmount.toFixed(2)}
          <p className="text-xs font-normal text-gray-500">
            Method: {returnData.refundMethod.replace(/_/g, ' ')}
            {returnData.notes && <span className="block text-gray-400 mt-0.5">{returnData.notes}</span>}
          </p>
        </div>

        <div className="border-t border-gray-300 pt-4 space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Phone Number:</p>
            <div className="border-b border-gray-400 mt-1 h-6"></div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Signature:</p>
            <div className="border-b border-gray-400 mt-1 h-8"></div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-6">
          <p>Processed by: {returnData.processedBy.name}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 print:hidden"
        >
          Close
        </button>
      </div>
    </div>
  )
}
