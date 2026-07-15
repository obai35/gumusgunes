import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { invalidateTranslationCache } from '@/lib/i18n/db-translations'

export const GET = withAdmin(async () => {
  try {
    const translations = await db.translation.findMany({ orderBy: { updatedAt: 'desc' } })
    return NextResponse.json({ ok: true, translations })
  } catch (err) {
    console.error('GET /api/admin/translations error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { key, en, ar, group } = await req.json()
    if (!key || en == null || ar == null) return NextResponse.json({ error: 'key, en, ar required' }, { status: 400 })
    const existing = await db.translation.findUnique({ where: { key } })
    if (existing) return NextResponse.json({ error: 'Key already exists' }, { status: 400 })
    const translation = await db.translation.create({ data: { key, en, ar, group: group || 'general' } })
    invalidateTranslationCache()
    return NextResponse.json({ ok: true, translation })
  } catch (err) {
    console.error('POST /api/admin/translations error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { id, key, en, ar, group } = await req.json()
    const data: any = {}
    if (key !== undefined) data.key = key
    if (en !== undefined) data.en = en
    if (ar !== undefined) data.ar = ar
    if (group !== undefined) data.group = group
    const translation = await db.translation.update({ where: { id }, data })
    invalidateTranslationCache()
    return NextResponse.json({ ok: true, translation })
  } catch (err) {
    console.error('PUT /api/admin/translations error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { id } = await req.json()
    await db.translation.delete({ where: { id } })
    invalidateTranslationCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/translations error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')
