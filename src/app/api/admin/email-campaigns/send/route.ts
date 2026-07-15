import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { sendEmail } from '@/lib/email'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { campaignId, testEmail } = await req.json()
    const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    let recipients: string[] = []
    if (testEmail) { recipients = [testEmail] } else {
      if (campaign.segment === 'all') { const subs = await db.newsletter.findMany({ select: { email: true } }); recipients = subs.map(s => s.email) }
      else if (campaign.segment === 'active') { const d30 = new Date(Date.now() - 30*24*60*60*1000); const users = await db.user.findMany({ where: { orders: { some: { createdAt: { gte: d30 } } } }, select: { email: true } }); recipients = users.map(u => u.email) }
      else if (campaign.segment === 'inactive') { const d30 = new Date(Date.now() - 30*24*60*60*1000); const active = await db.order.findMany({ where: { createdAt: { gte: d30 } }, select: { email: true }, distinct: ['email'] }); const set = new Set(active.map(o => o.email)); const users = await db.user.findMany({ select: { email: true } }); recipients = users.map(u => u.email).filter(e => !set.has(e)) }
      else if (campaign.segment === 'specific' && campaign.segmentIds) { const ids = JSON.parse(campaign.segmentIds); const users = await db.user.findMany({ where: { id: { in: ids } }, select: { email: true } }); recipients = users.map(u => u.email) }
    }
    if (recipients.length === 0) return NextResponse.json({ error: 'No recipients' }, { status: 400 })
    if (testEmail) { const sent = await sendEmail({ to: testEmail, subject: campaign.subject, html: campaign.content }); if (!sent) return NextResponse.json({ error: 'Failed' }, { status: 500 }); return NextResponse.json({ ok: true }) }
    await db.emailCampaign.update({ where: { id: campaignId }, data: { status: 'sending', totalCount: recipients.length } })
    let sentCount = 0
    for (let i = 0; i < recipients.length; i += 50) {
      const batch = recipients.slice(i, i + 50)
      const results = await Promise.allSettled(batch.map(email => sendEmail({ to: email, subject: campaign.subject, html: campaign.content })))
      sentCount += results.filter(r => r.status === 'fulfilled' && r.value).length
    }
    await db.emailCampaign.update({ where: { id: campaignId }, data: { status: 'sent', sentCount, sentAt: new Date() } })
    return NextResponse.json({ ok: true, sentCount, total: recipients.length })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
