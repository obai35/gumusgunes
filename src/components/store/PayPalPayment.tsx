'use client'

import { useEffect, useRef } from 'react'

declare global { interface Window { paypal?: any } }

type Props = {
  amount: number
  currency: string
  onSuccess: (orderId: string) => void
  clientId: string
  sandbox?: boolean
}

export default function PayPalPayment({ amount, currency, onSuccess, clientId }: Props) {
  const btnRef = useRef<HTMLDivElement>(null)
  const rendered = useRef(false)

  useEffect(() => {
    if (rendered.current || !btnRef.current) return

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency || 'EGP'}`
    script.onload = () => {
      if (!window.paypal || rendered.current) return
      rendered.current = true
      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch('/api/payments/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency }),
          })
          const data = await res.json()
          return data.id
        },
        onApprove: async (data: any) => {
          const res = await fetch('/api/payments/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paypalOrderId: data.orderID }),
          })
          const result = await res.json()
          if (result.status === 'COMPLETED') onSuccess(data.orderID)
        },
      }).render(btnRef.current)
    }
    document.body.appendChild(script)
    return () => { rendered.current = true }
  }, [])

  return <div ref={btnRef} className="min-h-[40px]" />
}
