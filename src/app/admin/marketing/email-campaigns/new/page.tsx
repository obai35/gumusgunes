'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Send, Save } from 'lucide-react'

export default function NewEmailCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState(''); const [subject, setSubject] = useState(''); const [content, setContent] = useState('')
  const [segment, setSegment] = useState('all'); const [saving, setSaving] = useState(false)

  async function handleSave(sendNow: boolean) {
    if (!name || !subject || !content) { toast.error('All fields required'); return }
    setSaving(true)
    const res = await fetch('/api/admin/email-campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, content, segment }) })
    const data = await res.json()
    if (res.ok) {
      if (sendNow) { const r2 = await fetch('/api/admin/email-campaigns/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: data.campaign.id }) }); if (r2.ok) toast.success('Sent!'); else toast.error('Created but send failed') } else toast.success('Draft saved')
      router.push('/admin/marketing/email-campaigns')
    } else toast.error(data.error || 'Failed')
    setSaving(false)
  }

  async function handleSendTest() {
    const testEmail = prompt('Enter test email:')
    if (!testEmail || !name || !subject || !content) { toast.error('Complete form first'); return }
    setSaving(true)
    const res = await fetch('/api/admin/email-campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, content, segment }) })
    const data = await res.json()
    if (res.ok) { const r2 = await fetch('/api/admin/email-campaigns/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: data.campaign.id, testEmail }) }); if (r2.ok) toast.success('Test sent!'); else toast.error('Test failed') }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Email Campaign" backHref="/admin/marketing/email-campaigns" />
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-navy block mb-1">Campaign Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Summer Sale" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Don't miss our sale!" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Segment</label>
          <select value={segment} onChange={e => setSegment(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            <option value="all">All Subscribers</option><option value="active">Active (30d)</option><option value="inactive">Inactive (30d)</option><option value="specific">Specific Customers</option>
          </select>
        </div>
        <div><label className="text-sm font-medium text-navy block mb-1">HTML Content</label><textarea value={content} onChange={e => setContent(e.target.value)} rows={15} placeholder="<h1>Your HTML here...</h1>" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> Draft</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-deep rounded-lg text-sm font-medium disabled:opacity-50"><Send className="h-4 w-4" /> Send</button>
          <button onClick={handleSendTest} disabled={saving} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Test</button>
        </div>
      </div>
    </div>
  )
}
