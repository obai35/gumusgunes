'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { CreditCard, Plus, Loader2, Trash2 } from 'lucide-react'

type SavedCard = {
  id: string
  nickname: string | null
  lastFour: string
  expiryMonth: number
  expiryYear: number
}

export function CardsSection() {
  const [cards, setCards] = useState<SavedCard[]>([])
  const [cardLoading, setCardLoading] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardForm, setCardForm] = useState({ nickname: '', cardNumber: '', expiryMonth: '', expiryYear: '' })
  const [cardSaving, setCardSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { fetchCards() }, [])

  async function fetchCards() {
    setCardLoading(true)
    try {
      const res = await fetch('/api/user/cards')
      if (res.ok) setCards(await res.json())
    } finally { setCardLoading(false) }
  }

  async function saveCard() {
    const newErrors: Record<string, string> = {}
    if (!cardForm.cardNumber || cardForm.cardNumber.length < 4) newErrors.cardNumber = 'Enter at least 4 digits'
    if (!cardForm.expiryMonth) newErrors.expiryMonth = 'Required'
    if (!cardForm.expiryYear) newErrors.expiryYear = 'Required'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setCardSaving(true)
    try {
      const res = await fetch('/api/user/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: cardForm.nickname || null,
          lastFour: cardForm.cardNumber.slice(-4),
          expiryMonth: parseInt(cardForm.expiryMonth),
          expiryYear: parseInt(cardForm.expiryYear),
        }),
      })
      if (res.ok) {
        toast.success('Card saved')
        setShowCardForm(false)
        setCardForm({ nickname: '', cardNumber: '', expiryMonth: '', expiryYear: '' })
        fetchCards()
      } else toast.error('Failed to save card')
    } catch { toast.error('Something went wrong') }
    finally { setCardSaving(false) }
  }

  async function deleteCard(id: string) {
    try {
      const res = await fetch(`/api/user/cards/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Card removed'); fetchCards() }
    } catch { toast.error('Failed to remove') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{cards.length} saved card{cards.length !== 1 ? 's' : ''}</p>
        <Button onClick={() => { setShowCardForm(true); setErrors({}) }} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep text-sm press">
          <Plus className="h-4 w-4 mr-1" /> Add Card
        </Button>
      </div>

      {showCardForm && (
        <div className="mb-6 p-5 rounded-2xl border border-border bg-secondary/20 space-y-4">
          <label className="relative block">
            <Input
              value={cardForm.nickname}
              onChange={(e) => { setCardForm(c => ({ ...c, nickname: e.target.value })); setErrors(prev => ({ ...prev, nickname: '' })) }}
              className={cn("peer rounded-xl pt-5", errors.nickname ? "border-red-500 animate-shake" : "")}
              placeholder=" "
            />
            <span className={cn(
              "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
              errors.nickname ? "text-red-500" : "text-muted-foreground",
              "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
              "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
            )}>
              Card Nickname
            </span>
            {errors.nickname && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.nickname}</p>}
          </label>
          <label className="relative block">
            <Input
              value={cardForm.cardNumber}
              onChange={(e) => { setCardForm(c => ({ ...c, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })); setErrors(prev => ({ ...prev, cardNumber: '' })) }}
              className={cn("peer rounded-xl pt-5 font-mono", errors.cardNumber ? "border-red-500 animate-shake" : "")}
              placeholder=" "
              maxLength={16}
            />
            <span className={cn(
              "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
              errors.cardNumber ? "text-red-500" : "text-muted-foreground",
              "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
              "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
            )}>
              Card Number
            </span>
            {errors.cardNumber && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.cardNumber}</p>}
          </label>
          <p className="text-xs text-muted-foreground">Only the last 4 digits will be stored</p>
          <div className="grid grid-cols-2 gap-4">
            <label className="relative block">
              <Input
                value={cardForm.expiryMonth}
                onChange={(e) => { setCardForm(c => ({ ...c, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })); setErrors(prev => ({ ...prev, expiryMonth: '' })) }}
                className={cn("peer rounded-xl pt-5 font-mono", errors.expiryMonth ? "border-red-500 animate-shake" : "")}
                placeholder=" "
                maxLength={2}
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.expiryMonth ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                Expiry Month
              </span>
              {errors.expiryMonth && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.expiryMonth}</p>}
            </label>
            <label className="relative block">
              <Input
                value={cardForm.expiryYear}
                onChange={(e) => { setCardForm(c => ({ ...c, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4) })); setErrors(prev => ({ ...prev, expiryYear: '' })) }}
                className={cn("peer rounded-xl pt-5 font-mono", errors.expiryYear ? "border-red-500 animate-shake" : "")}
                placeholder=" "
                maxLength={4}
              />
              <span className={cn(
                "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
                errors.expiryYear ? "text-red-500" : "text-muted-foreground",
                "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
                "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
              )}>
                Expiry Year
              </span>
              {errors.expiryYear && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.expiryYear}</p>}
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveCard} disabled={cardSaving} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">
              {cardSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Card
            </Button>
            <Button onClick={() => { setShowCardForm(false); setErrors({}) }} variant="outline" className="rounded-full press">Cancel</Button>
          </div>
        </div>
      )}

      {cardLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-border bg-white space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No saved cards yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="p-4 rounded-2xl border border-border bg-white flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy">{card.nickname || 'Card'}</p>
                <p className="font-mono text-sm text-navy/70">**** {card.lastFour}</p>
                <p className="text-xs text-muted-foreground">Expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</p>
              </div>
              <button onClick={() => deleteCard(card.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
