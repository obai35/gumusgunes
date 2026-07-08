'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function NewCampaign() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    goal: 'sales',
    budget: '',
    status: 'draft',
    startDate: '',
    endDate: '',
    triggerType: '',
    triggerInterval: '7',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) {
      toast.error('Campaign name is required')
      return
    }
    setSaving(true)
    const body: any = {
      name: form.name,
      goal: form.goal,
      budget: form.budget ? parseFloat(form.budget) : null,
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      triggerType: form.triggerType || null,
      triggerConfig: form.triggerType === 'scheduled' ? { intervalDays: parseInt(form.triggerInterval) } : null,
    }
    const res = await fetch('/api/admin/social/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Campaign created')
      router.push('/admin/social/campaigns')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to create campaign')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-display font-semibold">New Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Summer Collection Launch"
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Goal</label>
          <select
            value={form.goal}
            onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
          >
            <option value="awareness">Awareness</option>
            <option value="engagement">Engagement</option>
            <option value="sales">Sales</option>
            <option value="followers">Followers</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Budget (optional)</label>
          <input
            type="number"
            step="0.01"
            value={form.budget}
            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
            placeholder="E£0.00"
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Trigger Type</label>
          <select
            value={form.triggerType}
            onChange={e => setForm(f => ({ ...f, triggerType: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
          >
            <option value="">No automation</option>
            <option value="scheduled">Scheduled recurring posts</option>
          </select>
        </div>

        {form.triggerType === 'scheduled' && (
          <div>
            <label className="block text-sm font-medium mb-1">Post Interval (days)</label>
            <input
              type="number"
              min="1"
              value={form.triggerInterval}
              onChange={e => setForm(f => ({ ...f, triggerInterval: e.target.value }))}
              className="w-full p-3 rounded-xl bg-background border border-border text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full p-3 rounded-xl bg-background border border-border text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 rounded-full text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
