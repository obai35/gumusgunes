'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function PushCampaignDetailPage() {
  const params = useParams(); const [campaign, setCampaign] = useState<any>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/admin/push-campaigns/' + params.id).then(r => r.json()).then(d => setCampaign(d.campaign)).catch(() => toast.error('Failed')).finally(() => setLoading(false)) }, [params.id])
  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32" /></div>
  if (!campaign) return <div className="p-6 text-muted-foreground">Not found</div>
  return (
    <div className="max-w-lg">
      <PageHeader title={campaign.name} backHref="/admin/marketing/push-campaigns" />
      <div className="space-y-4">
        <div><span className="text-sm font-medium text-navy">Title:</span><p className="text-sm text-muted-foreground">{campaign.title}</p></div>
        <div><span className="text-sm font-medium text-navy">Body:</span><p className="text-sm text-muted-foreground">{campaign.body}</p></div>
        <div><span className="text-sm font-medium text-navy">Segment:</span><p className="text-sm text-muted-foreground capitalize">{campaign.segment}</p></div>
        <div><span className="text-sm font-medium text-navy">Status:</span><span className={'ml-2 px-2 py-0.5 rounded text-xs font-medium ' + (campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : campaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{campaign.status}</span></div>
        {campaign.sentCount > 0 && <div><span className="text-sm font-medium text-navy">Sent:</span><span className="text-sm text-muted-foreground ml-2">{campaign.sentCount}/{campaign.totalCount}</span></div>}
      </div>
    </div>
  )
}
