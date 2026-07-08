'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function SocialSettings() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [form, setForm] = useState({ platform: 'instagram', accountId: '', accountName: '', accessToken: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/social/accounts').then(r => r.json()).then(setAccounts).finally(() => setLoading(false))
  }, [])

  async function addAccount() {
    if (!form.accountId || !form.accountName || !form.accessToken) {
      toast.error('All fields required')
      return
    }
    const res = await fetch('/api/admin/social/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Account connected')
      setForm({ platform: 'instagram', accountId: '', accountName: '', accessToken: '' })
      const updated = await fetch('/api/admin/social/accounts').then(r => r.json())
      setAccounts(updated)
    } else {
      toast.error('Failed to connect')
    }
  }

  async function removeAccount(id: string) {
    const res = await fetch(`/api/admin/social/accounts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Account removed')
      setAccounts(accounts.filter(a => a.id !== id))
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-8 p-6 max-w-2xl">
      <h1 className="text-2xl font-display font-semibold">Social Media Settings</h1>

      <div className="space-y-3">
        <h2 className="font-semibold">Connected Accounts</h2>
        {accounts.length === 0 && <p className="text-sm text-muted-foreground">No accounts connected yet.</p>}
        {accounts.map(a => (
          <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border/40">
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gold/10 text-gold uppercase mr-2">{a.platform}</span>
              <span className="font-medium">{a.accountName}</span>
            </div>
            <button onClick={() => removeAccount(a.id)} className="text-sm text-destructive hover:underline">Remove</button>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-secondary/30 border border-border/30 space-y-4">
        <h2 className="font-semibold">Add Account</h2>
        <select
          value={form.platform}
          onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
          className="w-full p-3 rounded-xl bg-background border border-border text-sm"
        >
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
        </select>
        <input
          placeholder="Account ID"
          value={form.accountId}
          onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
          className="w-full p-3 rounded-xl bg-background border border-border text-sm"
        />
        <input
          placeholder="Account Name"
          value={form.accountName}
          onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
          className="w-full p-3 rounded-xl bg-background border border-border text-sm"
        />
        <input
          placeholder="Access Token"
          value={form.accessToken}
          onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
          className="w-full p-3 rounded-xl bg-background border border-border text-sm font-mono"
        />
        <button
          onClick={addAccount}
          className="px-6 py-3 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors"
        >
          Connect Account
        </button>
      </div>
    </div>
  )
}
