'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { PageHeader } from '@/components/admin/PageHeader'
import { Bell, Save } from 'lucide-react'

export default function NewPushCampaignPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const router = useRouter()
  const [name, setName] = useState(''); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [segment, setSegment] = useState('all'); const [saving, setSaving] = useState(false)

  async function handleSave(sendNow: boolean) {
    if (!name || !title || !body) { toast.error(ta('All fields required')); return }
    setSaving(true); const res = await fetch('/api/admin/push-campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, title, body, segment }) })
    const data = await res.json()
    if (res.ok) {
      if (sendNow) { const r2 = await fetch('/api/admin/push-campaigns/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: data.campaign.id }) }); if (r2.ok) toast.success(ta('Sent!')); else toast.error(ta('Created but send failed')) } else toast.success(ta('Draft saved'))
      router.push('/admin/marketing/push-campaigns')
    } else toast.error(data.error || ta('Failed'))
    setSaving(false)
  }

  return (
    <div className="max-w-lg">
      <PageHeader title={ta('New Push Campaign')} backHref="/admin/marketing/push-campaigns" />
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-navy block mb-1">{ta('Name')}</label><input value={name} onChange={e => setName(e.target.value)} placeholder={ta('Flash Sale')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">{ta('Notification Title')}</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder={ta('50% Off!')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">{ta('Body')}</label><textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder={ta('Limited time offer')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">{ta('Send To')}</label>
          <select value={segment} onChange={e => setSegment(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            <option value="all">{ta('All (Customers + Admins)')}</option><option value="customers">{ta('Customers Only')}</option><option value="admins">{ta('Admins Only')}</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> {ta('Draft')}</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-deep rounded-lg text-sm font-medium disabled:opacity-50"><Bell className="h-4 w-4" /> {ta('Send Now')}</button>
        </div>
      </div>
    </div>
  )
}
