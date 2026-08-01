'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function EditSegmentPage() {
  const { id } = useParams()
  const router = useRouter()
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [name, setName] = useState('')
  const [minSpend, setMinSpend] = useState('')
  const [minOrders, setMinOrders] = useState('')
  const [registeredBefore, setRegisteredBefore] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/customers/segments/${id}`)
      .then(r => r.json())
      .then(data => {
        const s = data.segment
        setName(s.name)
        setIsActive(s.isActive)
        const rules = s.rules || {}
        if (rules.minSpend) setMinSpend(String(rules.minSpend))
        if (rules.minOrders) setMinOrders(String(rules.minOrders))
        if (rules.registeredBefore) setRegisteredBefore(rules.registeredBefore.split('T')[0])
      })
      .catch(() => toast.error(ta('Failed to load segment')))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error(ta('Name is required')); return }
    setSaving(true)
    const rules: Record<string, any> = {}
    if (minSpend) rules.minSpend = parseFloat(minSpend)
    if (minOrders) rules.minOrders = parseInt(minOrders)
    if (registeredBefore) rules.registeredBefore = registeredBefore
    try {
      const res = await fetch(`/api/admin/customers/segments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), rules, isActive }),
      })
      if (!res.ok) { toast.error(ta('Failed to update')); return }
      toast.success(ta('Segment updated'))
      router.push('/admin/customers/segments')
    } catch {
      toast.error(ta('Failed to update'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">{ta('Loading...')}</div>

  return (
    <div>
      <PageHeader title={ta('Edit Segment')} backHref="/admin/customers/segments" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">{ta('Segment Name *')}</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ta('Min Total Spend ($)')}</label>
              <input type="number" value={minSpend} onChange={e => setMinSpend(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ta('Min Orders')}</label>
              <input type="number" value={minOrders} onChange={e => setMinOrders(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ta('Registered Before')}</label>
              <input type="date" value={registeredBefore} onChange={e => setRegisteredBefore(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{ta('Active')}</label>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded border-border" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
                {saving ? ta('Saving...') : ta('Save Changes')}
              </button>
              <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy transition-colors">
                {ta('Cancel')}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
