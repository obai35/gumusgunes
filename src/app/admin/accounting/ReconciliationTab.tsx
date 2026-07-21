'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, CheckCircle, XCircle, Link2 } from 'lucide-react'
import { formatCurrency } from './page'

export default function ReconciliationTab() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [matchEntryId, setMatchEntryId] = useState('')

  useEffect(() => {
    fetch('/api/admin/accounting/bank-accounts')
      .then(r => r.json())
      .then(d => { setAccounts(d.accounts || []); setLoading(false); if (d.accounts?.length) setSelectedAccount(d.accounts[0].id) })
      .catch(() => { toast.error('Failed to load bank accounts'); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!selectedAccount) return
    setLoading(true)
    fetch(`/api/admin/accounting/bank-accounts/${selectedAccount}/transactions`)
      .then(r => r.json())
      .then(d => { setTransactions(d.transactions || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load transactions'); setLoading(false) })
  }, [selectedAccount])

  async function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      const lines = text.split('\n').filter(Boolean)
      const headers = lines[0].split(',')
      const transactions = lines.slice(1).map(line => {
        const vals = line.split(',')
        const obj: any = {}
        headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim())
        return { date: obj.date || obj.Date, description: obj.description || obj.Description, reference: obj.reference || obj.Reference, debit: parseFloat(obj.debit || obj.Debit || 0), credit: parseFloat(obj.credit || obj.Credit || 0), balance: parseFloat(obj.balance || obj.Balance || 0) }
      })
      const res = await fetch(`/api/admin/accounting/bank-accounts/${selectedAccount}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactions }) })
      if (res.ok) { toast.success(`Imported ${transactions.length} transactions`); window.location.reload() }
      else toast.error('Import failed')
    }
    input.click()
  }

  async function handleAutoMatch() {
    const res = await fetch(`/api/admin/accounting/bank-accounts/${selectedAccount}/match`, { method: 'POST' })
    const d = await res.json()
    setSuggestions(d.suggestions || [])
    toast.success(`Found ${d.suggestions?.length || 0} possible matches`)
  }

  async function handleMatch(txId: string, entryId: string) {
    const res = await fetch(`/api/admin/accounting/bank-accounts/${selectedAccount}/transactions/${txId}/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId }) })
    if (res.ok) { toast.success('Transaction matched'); setSelectedTx(null) }
    else toast.error('Match failed')
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>

  const matched = transactions.filter(t => t.isReconciled)
  const unmatched = transactions.filter(t => !t.isReconciled)
  const totalCleared = matched.reduce((s, t) => s + (t.debit || 0) - (t.credit || 0), 0)
  const totalOutstanding = unmatched.reduce((s, t) => s + (t.debit || 0) - (t.credit || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bankName})</option>)}
        </select>
        <button onClick={handleImport} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5">
          <Upload className="h-4 w-4" /> Import CSV
        </button>
        <button onClick={handleAutoMatch} className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1.5">
          <Link2 className="h-4 w-4" /> Auto-match
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
          <p className="text-xl font-bold text-navy">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Cleared</p>
          <p className="text-xl font-bold text-green-600">{matched.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
          <p className="text-xl font-bold text-amber-600">{unmatched.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-navy">Bank Transactions</h3>
          <span className="text-xs text-muted-foreground">{unmatched.length} unmatched</span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white"><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Description</th><th className="p-3 font-medium text-right">Debit</th><th className="p-3 font-medium text-right">Credit</th><th className="p-3 font-medium text-center">Status</th><th className="p-3 font-medium">Actions</th></tr></thead>
            <tbody>
              {transactions.map(tx => {
                const suggestion = suggestions.find(s => s.transactionId === tx.id)
                return (
                  <tr key={tx.id} className={`border-b border-border/50 hover:bg-gray-50 ${tx.isReconciled ? 'bg-green-50/50' : suggestion ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-3 text-navy">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                    <td className="p-3 text-navy">{tx.description}</td>
                    <td className="p-3 text-right text-red-600">{tx.debit > 0 ? formatCurrency(tx.debit) : ''}</td>
                    <td className="p-3 text-right text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : ''}</td>
                    <td className="p-3 text-center">{tx.isReconciled ? <CheckCircle className="h-4 w-4 text-green-600 inline" /> : <XCircle className="h-4 w-4 text-amber-400 inline" />}</td>
                    <td className="p-3">
                      {!tx.isReconciled && (
                        <button onClick={() => { setSelectedTx(selectedTx?.id === tx.id ? null : tx); setMatchEntryId('') }} className="text-xs text-navy hover:text-gold">
                          {selectedTx?.id === tx.id ? 'Cancel' : 'Match'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <h4 className="text-sm font-semibold text-navy mb-3">Match Transaction: {selectedTx.description}</h4>
          <p className="text-xs text-muted-foreground mb-3">Amount: {formatCurrency(selectedTx.debit + selectedTx.credit)}</p>
          <p className="text-xs text-muted-foreground mb-2">Match with journal entry:</p>
          <input type="text" placeholder="Enter journal entry ID..." value={matchEntryId} onChange={e => setMatchEntryId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3" />
          <button onClick={() => handleMatch(selectedTx.id, matchEntryId)} disabled={!matchEntryId} className="px-4 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">Match</button>
        </div>
      )}
    </div>
  )
}
