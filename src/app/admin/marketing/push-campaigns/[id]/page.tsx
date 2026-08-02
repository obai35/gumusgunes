'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function PushCampaignDetailPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const params = useParams(); const [campaign, setCampaign] = useState<any>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/admin/push-campaigns/' + params.id).then(r => r.json()).then(d => setCampaign(d.campaign)).catch(() => toast.error(ta('Failed'))).finally(() => setLoading(false)) }, [params.id])
  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32" /></div>
  if (!campaign) return <div className="p-6 text-muted-foreground">{ta('Not found')}</div>
  return (
    <div className="max-w-lg">
      <PageHeader title={campaign.name} backHref="/admin/marketing/push-campaigns" />
      <div className="space-y-4">
        <div><span className="text-sm font-medium text-navy">{ta('Title')}:</span><p className="text-sm text-muted-foreground">{campaign.title}</p></div>
        <div><span className="text-sm font-medium text-navy">{ta('Body')}:</span><p className="text-sm text-muted-foreground">{campaign.body}</p></div>
        <div><span className="text-sm font-medium text-navy">{ta('Segment')}:</span><p className="text-sm text-muted-foreground capitalize">{campaign.segment}</p></div>
        <div><span className="text-sm font-medium text-navy">{ta('Status')}:</span><span className={'ml-2 px-2 py-0.5 rounded text-xs font-medium ' + (campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : campaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{campaign.status}</span></div>
        {campaign.sentCount > 0 && <div><span className="text-sm font-medium text-navy">{ta('Sent')}:</span><span className="text-sm text-muted-foreground ml-2">{fmtNum(campaign.sentCount)}/{fmtNum(campaign.totalCount)}</span></div>}
      </div>
    </div>
  )
}
