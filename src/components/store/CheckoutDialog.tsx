'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, CreditCard, Banknote, Wallet, ShieldCheck, Loader2, PartyPopper, Gift } from 'lucide-react'
import { useCart, useUI } from '@/lib/store'
import { cn } from '@/lib/format'
import { useFormatPrice } from '@/hooks/use-format-price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Order } from '@/lib/types'

type Step = 'details' | 'payment' | 'processing' | 'done'

const GIFT_WRAP_PRICE = 5

export function CheckoutDialog() {
  const { isOpen: _, items, subtotal, clearCart } = useCart()
  const { checkoutOpen, setCheckoutOpen } = useUI()
  const formatPrice = useFormatPrice()
  const [step, setStep] = useState<Step>('details')
  const [order, setOrder] = useState<Order | null>(null)
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Turkey',
    notes: '',
    paymentMethod: 'card' as 'card' | 'transfer' | 'cod',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: '',
    giftWrap: false,
    giftMessage: '',
  })

  const total = subtotal()
  const shipping = total >= 250 ? 0 : 15
  const giftWrapFee = form.giftWrap ? GIFT_WRAP_PRICE : 0
  const tax = total * 0.18
  const grandTotal = total + shipping + tax + giftWrapFee

  if (!checkoutOpen) return null

  const handleClose = () => {
    setCheckoutOpen(false)
    if (step === 'done') {
      clearCart()
      setStep('details')
      setOrder(null)
      setForm((f) => ({ ...f, cardNumber: '', cardName: '', cardExpiry: '', cardCvc: '' }))
    }
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.fullName || !form.address || !form.city || !form.postalCode) {
      toast.error('Please fill in all required fields')
      return
    }
    setStep('payment')
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep('processing')
    try {
      const payload = {
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        country: form.country,
        notes: [form.notes, form.giftWrap && form.giftMessage ? `[Gift message: ${form.giftMessage}]` : '', form.giftWrap ? '[Gift wrapping included]' : ''].filter(Boolean).join('\n'),
        paymentMethod: form.paymentMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        subtotal: total,
        shipping,
        tax,
        totalAmount: grandTotal,
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setOrder(data.order)
      setStep('done')
      toast.success('Order placed successfully!')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to place order')
      setStep('payment')
    }
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
                  {step === 'done' ? 'Order Confirmed' : 'Checkout'}
                </h2>
                {step !== 'done' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Step {step === 'details' ? '1' : '2'} of 2 · {step === 'details' ? 'Shipping details' : 'Payment'}
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
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="Ayşe Yılmaz"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Shipping Address *</Label>
                    <Input
                      id="address"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Street address, building, apt"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Istanbul"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        required
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        placeholder="34000"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        required
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+90 5XX XXX XX XX"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Order Notes (optional)</Label>
                    <textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Delivery instructions, special requests, etc."
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  {/* Gift wrap option */}
                  <div className={cn(
                    'p-4 rounded-xl border-2 transition-colors cursor-pointer',
                    form.giftWrap ? 'border-gold bg-gold/5' : 'border-border bg-secondary/30 hover:border-gold/40'
                  )}
                    onClick={() => setForm({ ...form, giftWrap: !form.giftWrap })}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'h-5 w-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                        form.giftWrap ? 'bg-gold border-gold' : 'border-border'
                      )}>
                        {form.giftWrap && <Check className="h-3 w-3 text-navy-deep" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="h-4 w-4 text-gold" />
                          <span className="font-display text-sm font-semibold text-navy">
                            Signature Gift Wrapping
                          </span>
                          <span className="ml-auto text-sm font-semibold text-gold">
                            +{formatPrice(GIFT_WRAP_PRICE)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Each piece arrives in our signature navy box with a hand-tied gold ribbon.
                          Add a personalized note below.
                        </p>
                        {form.giftWrap && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <textarea
                              value={form.giftMessage}
                              onChange={(e) => setForm({ ...form, giftMessage: e.target.value })}
                              placeholder="Write a gift message (optional)…"
                              maxLength={200}
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-gold"
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                      <span className="font-medium text-navy">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium text-navy">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                    </div>
                    {giftWrapFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Gift className="h-3 w-3 text-gold" /> Gift wrapping
                        </span>
                        <span className="font-medium text-navy">{formatPrice(giftWrapFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (18% VAT)</span>
                      <span className="font-medium text-navy">{formatPrice(tax)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-semibold text-navy">Total</span>
                      <span className="font-display text-lg font-semibold gold-text">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep font-semibold tracking-wide"
                  >
                    Continue to Payment
                  </Button>
                </form>
              )}

              {step === 'payment' && (
                <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
                  {/* Payment method */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'card', label: 'Card', icon: CreditCard },
                        { id: 'transfer', label: 'Bank Transfer', icon: Banknote },
                        { id: 'cod', label: 'Cash on Delivery', icon: Wallet },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setForm({ ...form, paymentMethod: m.id as 'card' | 'transfer' | 'cod' })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                            form.paymentMethod === m.id
                              ? 'border-gold bg-gold/5'
                              : 'border-border hover:border-gold/50'
                          }`}
                        >
                          <m.icon className={`h-5 w-5 ${form.paymentMethod === m.id ? 'text-gold' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium ${form.paymentMethod === m.id ? 'text-navy' : 'text-muted-foreground'}`}>
                            {m.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.paymentMethod === 'card' && (
                    <div className="space-y-4 p-4 rounded-xl bg-secondary/30">
                      <div className="space-y-1.5">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          value={form.cardNumber}
                          onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                          placeholder="4242 4242 4242 4242"
                          className="rounded-xl font-mono"
                          maxLength={19}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input
                          id="cardName"
                          value={form.cardName}
                          onChange={(e) => setForm({ ...form, cardName: e.target.value })}
                          placeholder="AYSE YILMAZ"
                          className="rounded-xl uppercase"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="cardExpiry">Expiry</Label>
                          <Input
                            id="cardExpiry"
                            value={form.cardExpiry}
                            onChange={(e) => setForm({ ...form, cardExpiry: e.target.value })}
                            placeholder="MM/YY"
                            className="rounded-xl font-mono"
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cardCvc">CVC</Label>
                          <Input
                            id="cardCvc"
                            value={form.cardCvc}
                            onChange={(e) => setForm({ ...form, cardCvc: e.target.value })}
                            placeholder="123"
                            className="rounded-xl font-mono"
                            maxLength={4}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 text-gold" />
                        This is a demo — no real payment will be processed.
                      </p>
                    </div>
                  )}

                  {form.paymentMethod === 'transfer' && (
                    <div className="p-4 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
                      <p className="font-medium text-navy mb-1">Bank Transfer Details</p>
                      <p>Gümüş Güneş Jewellery Ltd.</p>
                      <p>İş Bankası · TR12 0006 4000 0011 2345 6789 01</p>
                      <p className="mt-2 text-xs">Reference: Your order number will be sent after submission.</p>
                    </div>
                  )}

                  {form.paymentMethod === 'cod' && (
                    <div className="p-4 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
                      <p className="font-medium text-navy mb-1">Cash on Delivery</p>
                      <p>Pay with cash when your order arrives. A small handling fee of $2 applies.</p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-navy text-silver space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-silver/60">Subtotal</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-silver/60">Shipping</span>
                      <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                    </div>
                    {giftWrapFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-silver/60 flex items-center gap-1">
                          <Gift className="h-3 w-3 text-gold" /> Gift wrapping
                        </span>
                        <span>{formatPrice(giftWrapFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-silver/60">Tax</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="border-t border-silver/20 pt-2 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-lg font-semibold gold-text">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setStep('details')}
                      variant="outline"
                      className="rounded-full px-6"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 rounded-full bg-gold text-navy-deep hover:bg-gold-soft font-semibold tracking-wide"
                    >
                      Place Order · {formatPrice(grandTotal)}
                    </Button>
                  </div>
                </form>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-gold mb-4" />
                  <h3 className="font-display text-xl font-semibold text-navy">Processing your order…</h3>
                  <p className="text-sm text-muted-foreground mt-1">Please do not close this window.</p>
                </div>
              )}

              {step === 'done' && order && (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="h-20 w-20 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mx-auto mb-6"
                  >
                    <Check className="h-10 w-10 text-gold" />
                  </motion.div>

                  <h3 className="font-display text-3xl font-semibold text-navy mb-2 flex items-center justify-center gap-2">
                    Thank you, {order.fullName.split(' ')[0]}!
                    <PartyPopper className="h-6 w-6 text-gold" />
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Your order has been received and is being prepared with care.
                  </p>

                  <div className="p-5 rounded-xl bg-secondary/50 text-left mb-6 max-w-md mx-auto">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground tracking-wide uppercase">Order Number</span>
                      <span className="font-mono font-semibold text-navy">{order.orderNumber}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground tracking-wide uppercase">Items</span>
                      <span className="font-medium text-navy">{order.items.length}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground tracking-wide uppercase">Total Paid</span>
                      <span className="font-display text-lg font-semibold gold-text">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground tracking-wide uppercase">Ship to</span>
                      <span className="font-medium text-navy text-right">{order.city}, {order.country}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto">
                    A confirmation email has been sent to <strong className="text-navy">{order.email}</strong>.
                    You will receive tracking information once your order ships.
                  </p>

                  <Button
                    onClick={handleClose}
                    className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep px-8"
                  >
                    Continue Shopping
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
