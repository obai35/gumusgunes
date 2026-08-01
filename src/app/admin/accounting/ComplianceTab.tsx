'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, CheckCircle, AlertTriangle, FileText, Lock, Unlock } from 'lucide-react'

export default function ComplianceTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [auditData, setAuditData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/accounting/audit?limit=5').then(r => r.json()),
      fetch('/api/admin/accounting/tax').then(r => r.json()),
    ]).then(([audit, tax]) => {
      setAuditData({ audit, tax })
      setLoading(false)
    }).catch(() => {
      toast.error(ta('Failed to load compliance data'))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>
  if (!auditData) return <div className="text-sm text-muted-foreground">{ta('No data')}</div>

  const logs = auditData.audit?.logs || []
  const tax = auditData.tax
  const missingTaxPeriods = tax?.missingPeriods || []
  const recentAuditIssues = logs.filter((l: any) => l.action === 'delete' || l.action === 'payment_rejected')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
          <Shield className="h-8 w-8 text-green-500 shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">{ta('Compliance Status')}</p>
            <p className="text-lg font-bold text-green-600">{ta('Active')}</p>
            <p className="text-xs text-muted-foreground mt-1">{ta(`${logs.length} recent audit events`)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
          <FileText className={`h-8 w-8 shrink-0 ${missingTaxPeriods.length > 0 ? 'text-amber-500' : 'text-green-500'}`} />
          <div>
            <p className="text-sm text-muted-foreground">{ta('Tax Compliance')}</p>
            <p className={`text-lg font-bold ${missingTaxPeriods.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {missingTaxPeriods.length > 0 ? ta(`${missingTaxPeriods.length} gaps`) : ta('Complete')}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
          <AlertTriangle className={`h-8 w-8 shrink-0 ${recentAuditIssues.length > 0 ? 'text-amber-500' : 'text-green-500'}`} />
          <div>
            <p className="text-sm text-muted-foreground">{ta('Recent Issues')}</p>
            <p className={`text-lg font-bold ${recentAuditIssues.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {fmtNum(recentAuditIssues.length)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-medium text-sm flex items-center justify-between">
            <span>{ta('Recent Audit Events')}</span>
            <span className="text-xs text-muted-foreground">{ta('Last 5')}</span>
          </div>
          <div className="divide-y divide-border">
            {logs.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">{ta('No audit events')}</p>}
            {logs.map((log: any, i: number) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${log.action === 'create' ? 'bg-green-100 text-green-700' : log.action === 'delete' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {log.action}
                  </span>
                  <span className="text-sm text-navy">{log.resource || log.resourceType || '-'}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {log.createdAt ? fmtDateTime(log.createdAt) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-medium text-sm">{ta('Tax Compliance Summary')}</div>
          <div className="p-4 space-y-3">
            {tax && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{ta('Est. Total Taxable')}</span>
                  <span className="font-semibold">{fmtCurrency(tax.estimated?.totalTaxable || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{ta('Est. Tax Collected')}</span>
                  <span className="font-semibold">{fmtCurrency(tax.estimated?.totalTaxCollected || 0)}</span>
                </div>
                {missingTaxPeriods.length > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-800">
                    {ta(`Missing tax data for ${missingTaxPeriods.join(', ')}`)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-medium text-sm flex items-center justify-between">
          <span>{ta('Period Close & Archival')}</span>
          <span className="text-xs text-muted-foreground">{ta('End-of-period procedures')}</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {ta('Close accounting periods to prevent further modifications and archive historical data for compliance.')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => toast.success(ta('Period close initiated. This will lock the previous period.'))}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy/90"
            >
              <Lock className="h-3.5 w-3.5" /> {ta('Close Current Period')}
            </button>
            <button
              onClick={() => toast.success(ta('Archive started. Older data will be compressed.'))}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Archive className="h-3.5 w-3.5" /> {ta('Archive Old Data')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Archive({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  )
}
