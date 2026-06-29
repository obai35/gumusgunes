'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, CreditCard, Banknote, Wallet, ShieldCheck, Loader2, PartyPopper, Gift, Smartphone, QrCode } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCart, useUI } from '@/lib/store'
import { useAuth } from '@/lib/auth-store'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Order } from '@/lib/types'

const StripePayment = dynamic(() => import('@/components/store/StripePayment'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />,
  ssr: false,
})
const PayPalPayment = dynamic(() => import('@/components/store/PayPalPayment'), {
  loading: () => <div className="animate-pulse h-10 bg-gray-100 rounded-lg" />,
  ssr: false,
})
const InstaPayQR = dynamic(() => import('@/components/store/InstaPayQR'), {
  loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />,
  ssr: false,
})
const WalletPayment = dynamic(() => import('@/components/store/WalletPayment'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />,
  ssr: false,
})

type Step = 'details' | 'payment' | 'processing' | 'done'
type PaymentMethod = 'card' | 'paypal' | 'transfer' | 'cod' | 'instapay' | 'vodafone-cash' | 'orange-cash' | 'etisalat-wallet' | 'fawry'

const GIFT_WRAP_PRICE = 5

const EGYPT_WALLETS = [
  { id: 'instapay' as PaymentMethod, label: 'InstaPay QR', icon: QrCode },
  { id: 'vodafone-cash' as PaymentMethod, label: 'Vodafone Cash', icon: Smartphone },
  { id: 'orange-cash' as PaymentMethod, label: 'Orange Cash', icon: Smartphone },
  { id: 'etisalat-wallet' as PaymentMethod, label: 'Etisalat Wallet', icon: Smartphone },
  { id: 'fawry' as PaymentMethod, label: 'Fawry', icon: Banknote },
]

export function CheckoutDialog() {
  const { items, subtotal, clearCart } = useCart()
  const { checkoutOpen, setCheckoutOpen } = useUI()
  const formatPrice = useFormatPrice()
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('details')
  const [order, setOrder] = useState<Order | null>(null)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState('')
  const [paypalOrderId, setPaypalOrderId] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState<Order | null>(null)
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: t('checkout.countryDefault'),
    notes: '',
    paymentMethod: 'card' as PaymentMethod,
    giftWrap: false,
    giftMessage: '',
  })

  const total = subtotal()
  const shipping = total >= 250 ? 0 : 15
  const giftWrapFee = form.giftWrap ? GIFT_WRAP_PRICE : 0
  const tax = total * 0.18
  const grandTotal = total + shipping + tax + giftWrapFee

  const buildPayload = useCallback((overrides = {}) => ({
    email: form.email,
    fullName: form.fullName,
    phone: form.phone,
    address: form.address,
    city: form.city,
    postalCode: form.postalCode,
    country: form.country,
    notes: [form.notes, form.giftWrap && form.giftMessage ? `[Gift message: ${form.giftMessage}]` : '', form.giftWrap ? '[Gift wrapping included]' : ''].filter(Boolean).join('\n'),
    paymentMethod: form.paymentMethod,
    items: items.map((i: any) => ({
      productId: i.product.id,
      quantity: i.quantity,
      price: i.product.price,
    })),
    subtotal: total,
    shipping,
    tax,
    totalAmount: grandTotal,
    idempotencyKey,
    ...overrides,
  }), [form, items, total, shipping, tax, grandTotal, idempotencyKey])

  const { token } = useAuth()
  const submitOrder = useCallback(async (overrides = {}) => {
    setStep('processing')
    try {
      const payload = buildPayload(overrides)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.duplicateItems) {
        setDuplicateWarning(data.existingOrder)
        setStep('payment')
        toast.warning('You already have a pending order with the same items')
        return
      }
      if (!data.ok) throw new Error(data.error)
      setOrder(data.order)
      setStep('done')
      toast.success(t('checkout.orderSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('checkout.orderFailed'))
      setStep('payment')
    }
  }, [buildPayload, t])

  const handleStripeSuccess = useCallback(() => {
    submitOrder({ stripePaymentIntentId })
  }, [submitOrder, stripePaymentIntentId])

  const handlePayPalSuccess = useCallback((id: string) => {
    setPaypalOrderId(id)
    submitOrder({ paypalOrderId: id })
  }, [submitOrder])

  if (!checkoutOpen) return null

  const handleClose = () => {
    setCheckoutOpen(false)
    if (step === 'done') {
      clearCart()
      setStep('details')
      setOrder(null)
    }
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.fullName || !form.address || !form.city || !form.postalCode) {
      toast.error(t('checkout.validationError'))
      return
    }
    setStep('payment')
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.paymentMethod === 'card') return // handled by StripePayment
    if (form.paymentMethod === 'paypal') return // handled by PayPalPayment
    if (['instapay', 'vodafone-cash', 'orange-cash', 'etisalat-wallet', 'fawry'].includes(form.paymentMethod)) {
      if (!paymentReference) {
        toast.error('Please enter the transaction reference')
        return
      }
      submitOrder({ paymentReference, walletProvider: form.paymentMethod === 'instapay' ? null : form.paymentMethod })
      return
    }
    submitOrder()
  }

  const renderPaymentForm = () => {
    if (form.paymentMethod === 'card') {
      return <StripePayment amount={grandTotal} currency="USD" onSuccess={handleStripeSuccess} />
    }
    if (form.paymentMethod === 'paypal') {
      return <PayPalPayment amount={grandTotal} currency="USD" onSuccess={handlePayPalSuccess} />
    }
    if (form.paymentMethod === 'transfer') {
      return (
        <div className="p-4 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
          <p className="font-medium text-navy mb-1">{t('checkout.bankName')}</p>
          <p>{t('checkout.bankIban')}</p>
          <p className="mt-2 text-xs">{t('checkout.bankReference')}</p>
        </div>
      )
    }
    if (form.paymentMethod === 'cod') {
      return (
        <div className="p-4 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
          <p className="font-medium text-navy mb-1">Cash on Delivery</p>
          <p>{t('checkout.codDesc')}</p>
        </div>
      )
    }
    if (form.paymentMethod === 'instapay') {
      return <InstaPayQR onReference={setPaymentReference} />
    }
    if (['vodafone-cash', 'orange-cash', 'etisalat-wallet', 'fawry'].includes(form.paymentMethod)) {
      return <WalletPayment provider={form.paymentMethod} onReference={setPaymentReference} />
    }
    return null
  }

  return (
    <AnimatePresence>
      {checkoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
        >
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-display text-2xl font-semibold text-navy">
                  {step === 'done' ? t('checkout.orderConfirmed') : t('checkout.title')}
                </h2>
                {step !== 'done' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step === 'details' ? t('checkout.step1') : t('checkout.step2')}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"
              >
                <X className="h-5 w-5 text-navy" />
              </button>
            </div>

            <div className="overflow-y-auto scroll-luxury flex-1">
              {step === 'details' && (
                <form onSubmit={handleDetailsSubmit} className="p-6 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">{t('checkout.email')} *</Label>
                      <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">{t('checkout.fullName')} *</Label>
                      <Input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Ayşe Yılmaz" className="rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">{t('checkout.address')} *</Label>
                    <Input id="address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address, building, apt" className="rounded-xl" />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">{t('checkout.city')} *</Label>
                      <Input id="city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Istanbul" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="postalCode">{t('checkout.postalCode')} *</Label>
                      <Input id="postalCode" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="34000" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">{t('checkout.country')} *</Label>
                      <Input id="country" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{t('checkout.phone')}</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5XX XXX XX XX" className="rounded-xl" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">{t('checkout.orderNotes')}</Label>
                    <textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Delivery instructions, special requests, etc." className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-gold" />
                  </div>

                  {/* Gift wrap option */}
                  <div className={cn('p-4 rounded-xl border-2 transition-colors cursor-pointer', form.giftWrap ? 'border-gold bg-gold/5' : 'border-border bg-secondary/30 hover:border-gold/40')}
                    onClick={() => setForm({ ...form, giftWrap: !form.giftWrap })}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('h-5 w-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors', form.giftWrap ? 'bg-gold border-gold' : 'border-border')}>
                        {form.giftWrap && <Check className="h-3 w-3 text-navy-deep" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="h-4 w-4 text-gold" />
                          <span className="font-display text-sm font-semibold text-navy">{t('checkout.giftWrappingLabel')}</span>
                          <span className="ml-auto text-sm font-semibold text-gold">+{formatPrice(GIFT_WRAP_PRICE)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t('checkout.giftWrappingDesc')}</p>
                        {form.giftWrap && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3" onClick={(e) => e.stopPropagation()}>
                            <textarea value={form.giftMessage} onChange={(e) => setForm({ ...form, giftMessage: e.target.value })} placeholder="Write a gift message (optional)…" maxLength={200} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-gold" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('cart.subtotal')} ({items.length} items)</span><span className="font-medium text-navy">{formatPrice(total)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('cart.shipping')}</span><span className="font-medium text-navy">{shipping === 0 ? t('cart.free') : formatPrice(shipping)}</span></div>
                    {giftWrapFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Gift className="h-3 w-3 text-gold" /> {t('checkout.giftWrappingLineItem')}</span><span className="font-medium text-navy">{formatPrice(giftWrapFee)}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('cart.tax')}</span><span className="font-medium text-navy">{formatPrice(tax)}</span></div>
                    <div className="border-t border-border pt-2 flex justify-between"><span className="font-semibold text-navy">{t('cart.total')}</span><span className="font-display text-lg font-semibold gold-text">{formatPrice(grandTotal)}</span></div>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep font-semibold tracking-wide">{t('checkout.continuePayment')}</Button>
                </form>
              )}

              {step === 'payment' && (
                <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
                  {/* Payment method selection */}
                  <div className="space-y-3">
                    <Label>{t('checkout.payment')}</Label>

                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Real-time</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'card' as PaymentMethod, label: t('checkout.card'), icon: CreditCard },
                        { id: 'paypal' as PaymentMethod, label: 'PayPal', icon: Wallet },
                      ].map((m) => (
                        <button key={m.id} type="button" onClick={() => setForm({ ...form, paymentMethod: m.id })} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${form.paymentMethod === m.id ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}>
                          <m.icon className={`h-5 w-5 ${form.paymentMethod === m.id ? 'text-gold' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium ${form.paymentMethod === m.id ? 'text-navy' : 'text-muted-foreground'}`}>{m.label}</span>
                        </button>
                      ))}
                    </div>

                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Manual</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'transfer' as PaymentMethod, label: t('checkout.transfer'), icon: Banknote },
                        { id: 'cod' as PaymentMethod, label: t('checkout.cod'), icon: Wallet },
                      ].map((m) => (
                        <button key={m.id} type="button" onClick={() => setForm({ ...form, paymentMethod: m.id })} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${form.paymentMethod === m.id ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}>
                          <m.icon className={`h-5 w-5 ${form.paymentMethod === m.id ? 'text-gold' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium ${form.paymentMethod === m.id ? 'text-navy' : 'text-muted-foreground'}`}>{m.label}</span>
                        </button>
                      ))}
                    </div>

                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Egypt</p>
                    <div className="grid grid-cols-3 gap-2">
                      {EGYPT_WALLETS.map((m) => (
                        <button key={m.id} type="button" onClick={() => setForm({ ...form, paymentMethod: m.id })} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${form.paymentMethod === m.id ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}>
                          <m.icon className={`h-5 w-5 ${form.paymentMethod === m.id ? 'text-gold' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium ${form.paymentMethod === m.id ? 'text-navy' : 'text-muted-foreground'}`}>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment form per method */}
                  {renderPaymentForm()}

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-navy text-silver space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-silver/60">{t('cart.subtotal')}</span><span>{formatPrice(total)}</span></div>
                    <div className="flex justify-between"><span className="text-silver/60">{t('cart.shipping')}</span><span>{shipping === 0 ? t('cart.free') : formatPrice(shipping)}</span></div>
                    {giftWrapFee > 0 && <div className="flex justify-between"><span className="text-silver/60 flex items-center gap-1"><Gift className="h-3 w-3 text-gold" /> {t('checkout.giftWrappingLineItem')}</span><span>{formatPrice(giftWrapFee)}</span></div>}
                    <div className="flex justify-between"><span className="text-silver/60">{t('cart.tax')}</span><span>{formatPrice(tax)}</span></div>
                    <div className="border-t border-silver/20 pt-2 flex justify-between"><span className="font-semibold">{t('cart.total')}</span><span className="font-display text-lg font-semibold gold-text">{formatPrice(grandTotal)}</span></div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" onClick={() => setStep('details')} variant="outline" className="rounded-full px-6">{t('checkout.backDetails')}</Button>
                    {!['card', 'paypal'].includes(form.paymentMethod) && (
                      <Button type="submit" className="flex-1 h-12 rounded-full bg-gold text-navy-deep hover:bg-gold-soft font-semibold tracking-wide">
                        {t('checkout.placeOrder')} · {formatPrice(grandTotal)}
                      </Button>
                    )}
                  </div>
                </form>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-gold mb-4" />
                  <h3 className="font-display text-xl font-semibold text-navy">{t('checkout.processing')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('checkout.dontClose')}</p>
                </div>
              )}

              {step === 'done' && order && (
                <div className="p-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="h-20 w-20 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mx-auto mb-6">
                    <Check className="h-10 w-10 text-gold" />
                  </motion.div>

                  <h3 className="font-display text-3xl font-semibold text-navy mb-2 flex items-center justify-center gap-2">
                    {t('checkout.thankYou')}{order.fullName.split(' ')[0]}!
                    <PartyPopper className="h-6 w-6 text-gold" />
                  </h3>
                  <p className="text-muted-foreground mb-6">{t('checkout.received')}</p>

                  <div className="p-5 rounded-xl bg-secondary/50 text-left mb-6 max-w-md mx-auto">
                    <div className="flex justify-between mb-2"><span className="text-xs text-muted-foreground tracking-wide uppercase">{t('checkout.orderNumber')}</span><span className="font-mono font-semibold text-navy">{order.orderNumber}</span></div>
                    <div className="flex justify-between mb-2"><span className="text-xs text-muted-foreground tracking-wide uppercase">{t('checkout.items')}</span><span className="font-medium text-navy">{order.items.length}</span></div>
                    <div className="flex justify-between mb-2"><span className="text-xs text-muted-foreground tracking-wide uppercase">{t('checkout.totalPaid')}</span><span className="font-display text-lg font-semibold gold-text">{formatPrice(order.totalAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground tracking-wide uppercase">{t('checkout.shipTo')}</span><span className="font-medium text-navy text-right">{order.city}, {order.country}</span></div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto">{t('checkout.confirmationEmail', order.email)}</p>

                  <Button onClick={handleClose} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep px-8">{t('checkout.continueShopping')}</Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
