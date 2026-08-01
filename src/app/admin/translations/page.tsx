'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function AdminTranslationsPage() {
  const { ta } = useAdminTranslate()
  const [translations, setTranslations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ key: '', en: '', ar: '', group: 'general' })

  useEffect(() => {
    fetch('/api/admin/translations').then(r => r.json()).then(d => {
      if (d.ok) setTranslations(Array.isArray(d.translations) ? d.translations : [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.key || !form.en || !form.ar) return toast.error(ta('Key, English, and Arabic required'))
    const url = '/api/admin/translations'
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { ...form, id: editing } : form
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      toast.success(editing ? ta('Translation updated') : ta('Translation created'))
      const data = await res.json()
      if (editing) {
        setTranslations(translations.map(t => t.id === editing ? data.translation : t))
      } else {
        setTranslations([data.translation, ...translations])
      }
      setShowForm(false); setEditing(null)
      setForm({ key: '', en: '', ar: '', group: 'general' })
    } else {
      const err = await res.json()
      toast.error(err.error || ta('Failed'))
    }
  }

  function editTranslation(t: any) {
    setForm({ key: t.key, en: t.en, ar: t.ar, group: t.group || 'general' })
    setEditing(t.id)
    setShowForm(true)
  }

  async function deleteTranslation(id: string) {
    if (!confirm(ta('Delete this translation?'))) return
    const res = await fetch('/api/admin/translations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setTranslations(translations.filter(t => t.id !== id))
      toast.success(ta('Translation deleted'))
    } else {
      const err = await res.json()
      toast.error(err.error || ta('Failed'))
    }
  }

  const filtered = translations.filter(t =>
    t.key.toLowerCase().includes(search.toLowerCase()) ||
    t.en.toLowerCase().includes(search.toLowerCase()) ||
    t.ar.includes(search)
  )

  if (loading) return <div className="p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">{ta('Translation Manager')}</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ key: '', en: '', ar: '', group: 'general' }) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Plus className="h-4 w-4" /> {showForm ? ta('Cancel') : ta('Add Translation')}
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ta('Search translations...')} className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" />
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-border p-5 mb-6 max-w-2xl space-y-3">
          <h3 className="font-semibold text-navy">{editing ? ta('Edit Translation') : ta('New Translation')}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">{ta('Key')}</label><input required value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1 font-mono" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">{ta('Group')}</label><input value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">{ta('English')}</label><textarea required rows={2} value={form.en} onChange={e => setForm({ ...form, en: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">{ta('Arabic')}</label><textarea required rows={2} dir="rtl" value={form.ar} onChange={e => setForm({ ...form, ar: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{editing ? ta('Update') : ta('Create')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">{ta('Cancel')}</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-64">{ta('Key')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{ta('English')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{ta('Arabic')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{ta('Group')}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{ta('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs text-navy">{t.key}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{t.en}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" dir="rtl">{t.ar}</td>
                <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-muted-foreground">{t.group}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => editTranslation(t)} className="text-gold hover:text-gold/80 text-xs font-medium">{ta('Edit')}</button>
                  <button onClick={() => deleteTranslation(t.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">{ta('Delete')}</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{search ? ta('No matching translations.') : ta('No translations yet.')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
