'use client'

import { useState, useEffect, useCallback } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

let stripePromise: Promise<any> | null = null

function getStripe(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

type StripeFormProps = {
  amount: number
  currency: string
  onSuccess: (paymentIntentId: string) => void
}

function StripeForm({ amount, currency, onSuccess }: StripeFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setError('')
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/order/success' },
      redirect: 'if_required',
    })
    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setProcessing(false)
    } else {
      onSuccess(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button type="submit" disabled={!stripe || processing} className="w-full mt-4 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
        {processing ? 'Processing...' : `Pay E£${amount.toFixed(2)}`}
      </button>
    </form>
  )
}

type Props = {
  amount: number
  currency: string
  onSuccess: (paymentIntentId: string) => void
  publishableKey: string
}

export default function StripePayment({ amount, currency, onSuccess, publishableKey }: Props) {
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(true)

  const init = useCallback(async () => {
    const res = await fetch('/api/payments/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency }),
    })
    const data = await res.json()
    setClientSecret(data.clientSecret)
    setLoading(false)
  }, [amount, currency])

  useEffect(() => { init() }, [init])

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />

  return (
    <Elements stripe={getStripe(publishableKey)} options={{ clientSecret, locale: 'en' }}>
      <StripeForm amount={amount} currency={currency} onSuccess={onSuccess} />
    </Elements>
  )
}
