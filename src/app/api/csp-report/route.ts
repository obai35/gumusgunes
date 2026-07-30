import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const report = await req.json()
    console.warn('[CSP Violation]', JSON.stringify(report, null, 2))

    const cspReport = report?.['csp-report'] || report
    if (cspReport?.['document-uri']) {
      await db.activityLog.create({
        data: {
          adminId: 'csp-monitor',
          action: 'csp_violation',
          resource: 'csp',
          storeId: '',
          details: JSON.stringify({
            documentUri: cspReport['document-uri'],
            violatedDirective: cspReport['violated-directive'],
            blockedUri: cspReport['blocked-uri'],
            sourceFile: cspReport['source-file'],
            lineNumber: cspReport['line-number'],
            columnNumber: cspReport['column-number'],
            originalPolicy: cspReport['original-policy'],
            effectiveDirective: cspReport['effective-directive'],
            disposition: cspReport['disposition'],
          }),
        },
      }).catch((err) => console.error('[CSP] Failed to store violation:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[CSP-report]', error)
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 })
  }
}
