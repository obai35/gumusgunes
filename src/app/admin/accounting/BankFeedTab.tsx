'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Landmark } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function BankFeedTab() {
  const [data, setData] = useState<{ connectors: { id: string; name: string }[]; accounts: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedConnector, setSelectedConnector] = useState('mock')
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  function fetchFeeds() {
    setLoading(true)
    fetch('/api/admin/accounting/bank-feeds')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load bank feeds')); setLoading(false) })
  }

  useEffect(() => { fetchFeeds() }, [])

  async function handleSync() {
    if (!selectedAccount) { toast.error(ta('Select a bank account')); return }
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/accounting/bank-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankAccountId: selectedAccount, connectorId: selectedConnector }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success(ta(`Imported ${result.imported} new transactions`))
      fetchFeeds()
    } catch (e: any) { toast.error(e.message || ta('Sync failed')) }
    finally { setSyncing(false) }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-32 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">{ta('No data')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          {ta('Sync Bank Transactions')}
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{ta('Bank Account')}</label>
            <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">{ta('Select account...')}</option>
              {data.accounts.map(acct => (
                <option key={acct.id} value={acct.id}>{acct.name} ({acct.bankName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{ta('Connector')}</label>
            <select value={selectedConnector} onChange={e => setSelectedConnector(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              {data.connectors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || !selectedAccount}
          className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? ta('Syncing...') : ta('Fetch Transactions')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">{ta('Bank Accounts')}</h3>
        {data.accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{ta('No bank accounts configured yet.')}</p>
        ) : (
          <div className="grid gap-3">
            {data.accounts.map(acct => (
              <div key={acct.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-navy">{acct.name}</p>
                  <p className="text-xs text-muted-foreground">{acct.bankName} · {acct.accountNumber}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${acct.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmtCurrency(acct.currentBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground">{ta('Opening:')} {fmtCurrency(acct.openingBalance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
