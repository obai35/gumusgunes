import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const report = await req.json()
    console.warn('[CSP Violation]', JSON.stringify(report, null, 2))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[CSP-report]', error)
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 })
  }
}
