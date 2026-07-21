import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const reports = await db.scheduledReport.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    reports: reports.map(r => ({
      ...r,
      config: JSON.parse(r.config),
      recipients: JSON.parse(r.recipients),
    })),
  })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { name, type, config, schedule, cronExpression, recipients, format } = await req.json()
    if (!name || !type || !schedule) {
      return NextResponse.json({ error: 'name, type, and schedule required' }, { status: 400 })
    }

    const nextRunAt = new Date()
    switch (schedule) {
      case 'daily':
        nextRunAt.setDate(nextRunAt.getDate() + 1)
        nextRunAt.setHours(8, 0, 0, 0)
        break
      case 'weekly':
        nextRunAt.setDate(nextRunAt.getDate() + (7 - nextRunAt.getDay()))
        nextRunAt.setHours(8, 0, 0, 0)
        break
      case 'monthly':
        nextRunAt.setMonth(nextRunAt.getMonth() + 1)
        nextRunAt.setDate(1)
        nextRunAt.setHours(8, 0, 0, 0)
        break
    }

    const report = await db.scheduledReport.create({
      data: {
        name,
        type,
        config: JSON.stringify(config || {}),
        schedule,
        cronExpression: cronExpression || null,
        recipients: JSON.stringify(recipients || []),
        format: format || 'pdf',
        nextRunAt,
      },
    })

    return NextResponse.json({
      ok: true,
      report: { ...report, config: JSON.parse(report.config), recipients: JSON.parse(report.recipients) },
    })
  } catch (e) {
    console.error('Scheduled report create error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.type) updateData.type = data.type
    if (data.config) updateData.config = JSON.stringify(data.config)
    if (data.schedule) updateData.schedule = data.schedule
    if (data.cronExpression !== undefined) updateData.cronExpression = data.cronExpression
    if (data.recipients) updateData.recipients = JSON.stringify(data.recipients)
    if (data.format) updateData.format = data.format
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const report = await db.scheduledReport.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ok: true,
      report: { ...report, config: JSON.parse(report.config), recipients: JSON.parse(report.recipients) },
    })
  } catch (e) {
    console.error('Scheduled report update error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.scheduledReport.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Scheduled report delete error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
