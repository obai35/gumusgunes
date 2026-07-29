import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { campaignId } = await req.json()
    const campaign = await sdb.pushCampaign.findFirst({ where: { id: campaignId } })
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    let tokens: { token: string; platform: string }[] = []
    if (campaign.segment === 'all' || campaign.segment === 'customers') { const ct = await sdb.customerPushToken.findMany({ select: { token: true, platform: true } }); tokens.push(...ct) }
    if (campaign.segment === 'all' || campaign.segment === 'admins') { const at = await sdb.pushToken.findMany({ select: { token: true, platform: true } }); tokens.push(...at) }
    if (tokens.length === 0) return NextResponse.json({ error: 'No tokens' }, { status: 400 })
    const unique = Array.from(new Map(tokens.map(t => [t.token, t])).values())
    await sdb.pushCampaign.update({ where: { id: campaignId }, data: { status: 'sending', totalCount: unique.length } })
    const payload = campaign.data ? JSON.parse(campaign.data) : {}
    let sent = 0
    for (let i = 0; i < unique.length; i += 100) {
      const batch = unique.slice(i, i + 100)
      const results = await Promise.allSettled(batch.map(t => fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: t.token, title: campaign.title, body: campaign.body, data: payload, sound: 'default', priority: 'high' }) }).then(r => r.ok)))
      sent += results.filter(r => r.status === 'fulfilled' && r.value).length
    }
    await sdb.pushCampaign.update({ where: { id: campaignId }, data: { status: 'sent', sentCount: sent, sentAt: new Date() } })
    return NextResponse.json({ ok: true, sentCount: sent, total: unique.length })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
