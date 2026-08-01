'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Send, Pencil } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { sanitizeHtmlContent } from '@/components/ui/SafeHtml'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function CampaignDetailPage() {
  const params = useParams(); const router = useRouter()
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [campaign, setCampaign] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false)
  const [name, setName] = useState(''); const [subject, setSubject] = useState(''); const [content, setContent] = useState('')

  useEffect(() => { fetch('/api/admin/email-campaigns/' + params.id).then(r => r.json()).then(d => { setCampaign(d.campaign); setName(d.campaign.name); setSubject(d.campaign.subject); setContent(d.campaign.content) }).catch(() => toast.error(ta('Failed'))).finally(() => setLoading(false)) }, [params.id])

  async function handleUpdate() {
    setSaving(true); const res = await fetch('/api/admin/email-campaigns/' + params.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, content }) }); if (res.ok) { toast.success(ta('Updated')); setCampaign(p => ({ ...p, name, subject, content })); setEditing(false) } else toast.error(ta('Failed')); setSaving(false)
  }

  async function handleSend() {
    setSaving(true); const res = await fetch('/api/admin/email-campaigns/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: params.id }) }); if (res.ok) { toast.success(ta('Sending!')); router.push('/admin/marketing/email-campaigns') } else { const d = await res.json(); toast.error(d.error || ta('Failed')) }; setSaving(false)
  }

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64" /></div>
  if (!campaign) return <div className="p-6 text-muted-foreground">{ta('Not found')}</div>

  const sb = (s: string) => { const m: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-100 text-blue-700', sending: 'bg-yellow-100 text-yellow-700', sent: 'bg-green-100 text-green-700' }; return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (m[s] || '')}>{s}</span> }

  return (
    <div className="max-w-3xl">
      <PageHeader title={campaign.name} backHref="/admin/marketing/email-campaigns" />
      <div className="space-y-4">
        <div className="flex items-center gap-3"><span className="text-sm font-medium text-navy">{ta('Status:')}</span>{sb(campaign.status)}{campaign.sentCount > 0 && <span className="text-xs text-muted-foreground">{fmtNum(campaign.sentCount)}/{fmtNum(campaign.totalCount)} {ta('sent')}</span>}</div>
        {editing ? (
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-navy block mb-1">{ta('Name')}</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-navy block mb-1">{ta('Subject')}</label><input value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-navy block mb-1">{ta('Content')}</label><textarea value={content} onChange={e => setContent(e.target.value)} rows={15} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>
            <div className="flex gap-3"><button onClick={handleUpdate} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm disabled:opacity-50">{ta('Save')}</button><button onClick={() => setEditing(false)} className="px-4 py-2 border border-border rounded-lg text-sm">{ta('Cancel')}</button></div>
          </div>
        ) : (
          <><div><span className="text-sm font-medium text-navy block mb-1">{ta('Subject:')}</span><span className="text-sm text-muted-foreground">{campaign.subject}</span></div>
          <div><span className="text-sm font-medium text-navy block mb-1">{ta('Segment:')}</span><span className="text-sm text-muted-foreground capitalize">{campaign.segment}</span></div>
          <div><span className="text-sm font-medium text-navy block mb-1">{ta('Content:')}</span><div className="border border-border rounded-lg p-4 mt-1 bg-white max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(campaign.content) }} /></div>
          {campaign.status === 'draft' && <div className="flex gap-3 pt-2"><button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy"><Pencil className="h-4 w-4" /> {ta('Edit')}</button><button onClick={handleSend} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-deep rounded-lg text-sm font-medium disabled:opacity-50"><Send className="h-4 w-4" /> {ta('Send Now')}</button></div>}
        </>
        )}
      </div>
    </div>
  )
}
