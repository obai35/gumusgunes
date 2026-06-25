'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Search, Loader2, Check, Clock, Truck, Home } from 'lucide-react'
import { useUI } from '@/lib/store'
import { useFormatPrice } from '@/hooks/use-format-price'
import { cn, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/use-translation'

type TimelineStep = {
  label: string
  description: string
  completed: boolean
  date: string | null
}

type OrderResult = {
  orderNumber: string
  status: string
  totalAmount: number
  subtotal: number
  shipping: number
  tax: number
  fullName: string
  email: string
  address: string
  city: string
  country: string
  paymentMethod: string
  notes: string | null
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      imageUrl: string
      slug: string
      category: string | null
    }
  }[]
}

const STEP_ICONS = [Check, Clock, Check, Truck, Home]

export function OrderTrackingModal() {
  const { t } = useTranslation()
  const { orderTrackingOpen, setOrderTrackingOpen } = useUI()
  const formatPrice = useFormatPrice()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<OrderResult | null>(null)
  const [timeline, setTimeline] = useState<TimelineStep[] | null>(null)
  const [error, setError] = useState('')

  if (!orderTrackingOpen) return null

  const handleClose = () => {
    setOrderTrackingOpen(false)
    // Reset after close animation
    setTimeout(() => {
      setOrder(null)
      setTimeline(null)
      setOrderNumber('')
      setEmail('')
      setError('')
    }, 300)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber || !email) return
    setLoading(true)
    setError('')
    setOrder(null)
    setTimeline(null)
    try {
      const res = await fetch(
        `/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
      )
      const data = await res.json()
      if (data.ok) {
        setOrder(data.order)
        setTimeline(data.timeline)
      } else {
        setError(data.error || t('orderTracking.orderNotFound'))
        toast.error(data.error || t('orderTracking.orderNotFound'))
      }
    } catch {
      setError(t('orderTracking.lookupFailed'))
      toast.error(t('orderTracking.lookupFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {orderTrackingOpen && (
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
            className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-navy text-silver">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gold" />
                <h2 className="font-display text-2xl font-semibold">{t('orderTracking.title')}</h2>
              </div>
              <button
                onClick={handleClose}
                className="h-9 w-9 rounded-full hover:bg-silver/10 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto scroll-luxury flex-1 p-6">
              {!order ? (
                /* Search form */
                <form onSubmit={handleSearch} className="space-y-4 max-w-md mx-auto py-6">
                  <div className="text-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mx-auto mb-3">
                      <Search className="h-7 w-7 text-gold" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-navy mb-1">
                      {t('orderTracking.searchHeading')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('orderTracking.searchDesc')}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="trackOrderNumber">{t('orderTracking.orderNumber')}</Label>
                    <Input
                      id="trackOrderNumber"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder={t('orderTracking.orderPlaceholder')}
                      className="rounded-xl font-mono uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="trackEmail">{t('orderTracking.email')}</Label>
                    <Input
                      id="trackEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('orderTracking.emailPlaceholder')}
                      className="rounded-xl"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep font-semibold tracking-wide"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('orderTracking.searching')}</>
                    ) : (
                      <><Search className="h-4 w-4 mr-2" /> {t('orderTracking.lookup')}</>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    {t('orderTracking.helpText')}
                  </p>
                </form>
              ) : (
                /* Order details + timeline */
                <div className="space-y-6">
                  {/* Order header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/40">
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t('orderTracking.orderLabel')}</p>
                      <p className="font-mono font-semibold text-navy text-lg">{order.orderNumber}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t('orderTracking.placedOn')}</p>
                      <p className="text-sm font-medium text-navy">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="font-display text-lg font-semibold text-navy mb-4">{t('orderTracking.statusHeading')}</h3>
                    <div className="relative pl-8">
                      {/* Vertical line */}
                      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

                      {timeline?.map((step, i) => {
                        const Icon = STEP_ICONS[i] || Check
                        return (
                          <div key={i} className="relative pb-6 last:pb-0">
                            <div
                              className={cn(
                                'absolute -left-8 h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors',
                                step.completed
                                  ? 'bg-gold border-gold text-navy-deep'
                                  : 'bg-background border-border text-muted-foreground'
                              )}
                            >
                              <Icon className="h-3 w-3" />
                            </div>
                            <div className="ml-2">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  'text-sm font-semibold',
                                  step.completed ? 'text-navy' : 'text-muted-foreground'
                                )}>
                                  {step.label}
                                </p>
                                {step.completed && step.date && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatDate(step.date)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                              {!step.completed && i === (timeline?.findIndex((s) => !s.completed) ?? -1) && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-gold">
                                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                                  {t('orderTracking.inProgress')}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="font-display text-lg font-semibold text-navy mb-3">{t('orderTracking.itemsHeading')} ({order.items.length})</h3>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30">
                          <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.product.category} · {t('orderTracking.qty')} {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-navy">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping + totals */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-secondary/30">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">{t('orderTracking.shippingTo')}</p>
                      <p className="text-sm font-medium text-navy">{order.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.address}</p>
                      <p className="text-xs text-muted-foreground">{order.city}, {order.country}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/30 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orderTracking.subtotal')}</span>
                        <span className="font-medium text-navy">{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orderTracking.shipping')}</span>
                        <span className="font-medium text-navy">{order.shipping === 0 ? t('orderTracking.free') : formatPrice(order.shipping)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orderTracking.tax')}</span>
                        <span className="font-medium text-navy">{formatPrice(order.tax)}</span>
                      </div>
                      <div className="border-t border-border pt-1.5 flex justify-between">
                        <span className="font-semibold text-navy">{t('orderTracking.total')}</span>
                        <span className="font-display font-semibold gold-text">{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-3 rounded-xl bg-gold/5 border border-gold/20">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-gold-soft mb-1">{t('orderTracking.orderNotes')}</p>
                      <p className="text-xs text-navy whitespace-pre-wrap">{order.notes}</p>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">
                      {t('orderTracking.contactText')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
