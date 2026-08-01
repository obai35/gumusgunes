'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { Gift, Settings, Save, Search } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { StatsCard } from '@/components/admin/StatsCard'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'

type R = { id: string; code: string; referredEmail: string | null; rewardType: string; rewardValue: number; status: string; createdAt: string }

export default function ReferralsPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [referrals, setReferrals] = useState<R[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [tp, setTp] = useState(0); const [search, setSearch] = useState('')
  const [config, setConfig] = useState<any>(null); const [cl, setCl] = useState(true); const [showConfig, setShowConfig] = useState(false); const [saving, setSaving] = useState(false)

  function fetchReferrals() { setLoading(true); const p = new URLSearchParams({ page: String(page) }); if (search) p.set('search', search); fetch('/api/admin/referrals?' + p).then(r => r.json()).then(d => { setReferrals(d.referrals || []); setTotal(d.total); setTp(d.totalPages) }).catch(() => toast.error(ta('Failed'))).finally(() => setLoading(false)) }
  function fetchConfig() { setCl(true); fetch('/api/admin/referrals/config').then(r => r.json()).then(d => setConfig(d.config)).finally(() => setCl(false)) }
  useEffect(() => { setPage(1) }, [search]); useEffect(() => { fetchReferrals() }, [page]); useEffect(() => { fetchConfig() }, [])

  async function handleSaveConfig() { setSaving(true); const r = await fetch('/api/admin/referrals/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) }); if (r.ok) toast.success(ta('Saved')); else toast.error(ta('Failed')); setSaving(false) }

  const columns: ColumnDef<R>[] = [
    { accessorKey: 'code', header: ta('Code'), cell: ({ row }) => <span className="font-mono text-xs font-bold text-navy bg-gray-100 px-2 py-0.5 rounded">{row.original.code}</span> },
    { accessorKey: 'referredEmail', header: ta('Referred'), cell: ({ row }) => <span className="text-muted-foreground">{row.original.referredEmail || '—'}</span> },
    { accessorKey: 'rewardType', header: ta('Reward'), cell: ({ row }) => <span className="text-xs capitalize">{row.original.rewardType} ({fmtCurrency(row.original.rewardValue)})</span> },
    { accessorKey: 'status', header: ta('Status'), cell: ({ row }) => { const s = row.original.status; return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (s === 'rewarded' ? 'bg-green-100 text-green-700' : s === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')}>{s}</span> } },
    { accessorKey: 'createdAt', header: ta('Date'), cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDate(row.original.createdAt)}</span> },
  ]

  return (
    <div>
      <PageHeader title={ta('Referral Program')} backHref="/admin/marketing" actions={<button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy"><Settings className="h-4 w-4" /> {ta('Settings')}</button>} />
      <div className="grid grid-cols-2 gap-4 mb-6"><StatsCard icon={Gift} label={ta('Total')} value={String(total)} /><StatsCard icon={Gift} label={ta('Rewarded')} value={String(referrals.filter(r => r.status === 'rewarded').length)} /></div>

      {showConfig && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h3 className="font-semibold text-navy mb-4">{ta('Configuration')}</h3>
          {cl ? <div className="text-sm text-muted-foreground">{ta('Loading...')}</div> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">{ta('Type')}</label><select value={config?.rewardType || 'discount'} onChange={e => setConfig({ ...config, rewardType: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="discount">{ta('Discount')}</option><option value="points">{ta('Points')}</option></select></div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">{ta('Reward Value')}</label><input type="number" value={config?.rewardValue || 10} onChange={e => setConfig({ ...config, rewardValue: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">{ta('Min Order')}</label><input type="number" value={config?.minOrder || 0} onChange={e => setConfig({ ...config, minOrder: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">{ta('Max/User')}</label><input type="number" value={config?.maxPerUser || 10} onChange={e => setConfig({ ...config, maxPerUser: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">{ta('Discount Days')}</label><input type="number" value={config?.discountDays || 30} onChange={e => setConfig({ ...config, discountDays: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div className="flex items-end pb-2.5"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={config?.isActive !== false} onChange={e => setConfig({ ...config, isActive: e.target.checked })} className="h-4 w-4" /><span className="text-sm text-navy">{ta('Active')}</span></label></div>
            </div>
          )}
          <button onClick={handleSaveConfig} disabled={saving} className="mt-4 flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> {ta(saving ? '...' : 'Save')}</button>
        </div>
      )}

      <div className="mb-5"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={ta('Search...')} className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" /></div></div>
      <DataTable columns={columns} data={referrals} loading={loading} keyExtractor={r => r.id} emptyTitle={ta('No referrals')} emptyDescription={ta('Referrals appear when customers share links.')} />
      <Pagination page={page} totalPages={tp} totalItems={total} onPageChange={setPage} />
    </div>
  )
}
