'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Activity, FileText, MessageSquareText, Calendar } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function CustomerDetailPage() {
  const { ta, fmtCurrency, fmtDate, fmtDateTime } = useAdminTranslate()
  const { id } = useParams()
  const [customer, setCustomer] = useState<any>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [emailLogs, setEmailLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [custRes, notesRes, activityRes, emailRes] = await Promise.all([
          fetch(`/api/admin/customers/${id}`),
          fetch(`/api/admin/customers/${id}/notes`),
          fetch(`/api/admin/customers/${id}/activity`),
          fetch(`/api/admin/customers/${id}/email-logs`),
        ])
        const custData = await custRes.json()
        const notesData = await notesRes.json()
        const activityData = await activityRes.json()
        const emailData = await emailRes.json()
        if (!custRes.ok) { toast.error(custData.error || ta('Failed to load')); return }
        setCustomer(custData.customer)
        setNotes(Array.isArray(notesData.notes) ? notesData.notes : [])
        setActivityLogs(Array.isArray(activityData.logs) ? activityData.logs : [])
        setEmailLogs(Array.isArray(emailData.emailLogs) ? emailData.emailLogs : [])
      } catch {
        toast.error(ta('Failed to load customer details'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleAddNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/admin/customers/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, note: newNote.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || ta('Failed to add note')); return }
      setNotes(prev => [data.note, ...prev])
      setNewNote('')
      toast.success(ta('Note added'))
    } catch {
      toast.error(ta('Failed to add note'))
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">{ta('Loading...')}</div>
  if (!customer) return <div className="p-8 text-muted-foreground">{ta('Customer not found')}</div>

  const totalSpend = customer.totalSpend ?? 0
  const orderCount = customer.orders?.length ?? 0

  return (
    <div>
      <PageHeader
        title={customer.name || customer.email}
        subtitle={ta(`Customer since ${fmtDate(customer.createdAt)}`)}
        backHref="/admin/customers"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ta('Total Orders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{orderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ta('Total Spend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{fmtCurrency(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ta('Loyalty Points')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{customer.loyaltyPoints ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ta('Loyalty Tier')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{customer.loyaltyTier?.name || ta('None')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{ta('Contact Info')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><span className="font-medium">{ta('Email:')}</span> {customer.email}</p>
          <p><span className="font-medium">{ta('Phone:')}</span> {customer.phone || '—'}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> {ta('Orders')}
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-1.5">
            <MessageSquareText className="h-4 w-4" /> {ta('Notes')} ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" /> {ta('Activity')}
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> {ta('Email History')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {customer.orders && customer.orders.length > 0 ? (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">{ta('Order #')}</th>
                    <th className="px-4 py-3">{ta('Date')}</th>
                    <th className="px-4 py-3">{ta('Items')}</th>
                    <th className="px-4 py-3">{ta('Total')}</th>
                    <th className="px-4 py-3">{ta('Status')}</th>
                    <th className="px-4 py-3">{ta('Branch')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customer.orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-navy">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {o.items?.map((i: any) => `${i.product?.name || ta('Product')} x${i.quantity}`).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-navy">{fmtCurrency(o.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          o.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{o.shift?.branch?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{ta('No orders yet')}</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder={ta('Add a note about this customer...')}
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-sm resize-none"
                  rows={2}
                />
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !newNote.trim()}
                  className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 self-end"
                >
                  {savingNote ? ta('Saving...') : ta('Add Note')}
                </button>
              </div>
            </CardContent>
          </Card>

          {notes.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{ta('No notes yet')}</CardContent></Card>
          ) : (
            notes.map((n: any) => (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {fmtDate(n.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {activityLogs.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{ta('No activity recorded yet')}</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log: any) => (
                <Card key={log.id}>
                  <CardContent className="p-3 flex items-start gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">{log.action}</p>
                      {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{fmtDateTime(log.createdAt)}</span>
                        {log.ip && <span>· {ta('IP')}: {log.ip}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          {emailLogs.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{ta('No emails sent yet')}</CardContent></Card>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">{ta('Type')}</th>
                    <th className="px-4 py-3">{ta('Subject')}</th>
                    <th className="px-4 py-3">{ta('Status')}</th>
                    <th className="px-4 py-3">{ta('Sent At')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {emailLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs capitalize">{log.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          log.status === 'sent' ? 'bg-green-100 text-green-700' :
                          log.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{log.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(log.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
