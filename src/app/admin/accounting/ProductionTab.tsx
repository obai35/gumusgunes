'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { Plus, Play, CheckCircle, XCircle, Package, Wrench, DollarSign, TrendingDown, AlertCircle } from 'lucide-react'
import { formatCurrency } from './format'

type Tab = 'orders' | 'boms' | 'work-centers'

export default function ProductionTab() {
  const { ta } = useAdminTranslate()
  const [tab, setTab] = useState<Tab>('orders')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([['orders', 'Production Orders'], ['boms', 'Bill of Materials'], ['work-centers', 'Work Centers']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${tab === key ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>{ta(label)}</button>
        ))}
      </div>
      {tab === 'orders' && <ProductionOrdersView />}
      {tab === 'boms' && <BomsView />}
      {tab === 'work-centers' && <WorkCentersView />}
    </div>
  )
}

function WorkCentersView() {
  const { ta } = useAdminTranslate()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')

  function fetchData() {
    setLoading(true)
    fetch('/api/admin/accounting/work-centers')
      .then(r => r.json()).then(d => { setItems(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load')); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  async function handleCreate() {
    try {
      const res = await fetch('/api/admin/accounting/work-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, hourlyRate: parseFloat(hourlyRate) || 0 }),
      })
      if (res.ok) { toast.success(ta('Work center created')); setShowForm(false); setName(''); setDescription(''); setHourlyRate(''); fetchData() }
      else toast.error(ta('Failed to create'))
    } catch { toast.error(ta('Failed to create')) }
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">{ta('Work Centers')}</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 transition-colors flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> {ta('Add')}</button>
      </div>
      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-border p-4 mb-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={ta('Name')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder={ta('Description (optional)')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} type="number" placeholder={ta('Hourly Rate')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <div className="flex gap-2"><button onClick={handleCreate} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">{ta('Save')}</button><button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm">{ta('Cancel')}</button></div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border bg-gray-50"><th className="p-3 font-medium">{ta('Name')}</th><th className="p-3 font-medium">{ta('Description')}</th><th className="p-3 font-medium text-right">{ta('Hourly Rate')}</th><th className="p-3 font-medium">{ta('Active')}</th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">{ta('No work centers')}</td></tr>}
            {items.map((wc: any) => (
              <tr key={wc.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{wc.name}</td>
                <td className="p-3 text-muted-foreground">{wc.description || '-'}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(wc.hourlyRate)}/hr</td>
                <td className="p-3">{wc.isActive ? <span className="text-green-600 text-xs font-medium">{ta('Active')}</span> : <span className="text-red-600 text-xs font-medium">{ta('Inactive')}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BomsView() {
  const { ta, fmtNum } = useAdminTranslate()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])

  function fetchData() {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/accounting/boms').then(r => r.json()),
      fetch('/api/admin/products?all=true').then(r => r.json()).catch(() => []),
    ]).then(([boms, prods]) => { setItems(boms); setProducts(prods?.products || prods || []); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load')); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">{ta('Bill of Materials')}</h3>
        <button onClick={() => setShowForm('new')} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 transition-colors flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> {ta('New BOM')}</button>
      </div>
      {showForm === 'new' && <BomForm products={products} onDone={() => { setShowForm(null); fetchData() }} />}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border bg-gray-50"><th className="p-3 font-medium">{ta('Product')}</th><th className="p-3 font-medium">{ta('Version')}</th><th className="p-3 font-medium text-right">{ta('Items')}</th><th className="p-3 font-medium text-right">{ta('Total Cost')}</th><th className="p-3 font-medium">{ta('Active')}</th><th className="p-3 font-medium">{ta('Actions')}</th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{ta('No BOMs')}</td></tr>}
            {items.map((bom: any) => (
              <tr key={bom.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{bom.product?.name || '-'}</td>
                <td className="p-3 text-muted-foreground">{bom.version}</td>
                <td className="p-3 text-right">{fmtNum(bom.items?.length || 0)}</td>
                <td className="p-3 text-right font-mono font-semibold">{formatCurrency(bom.items?.reduce((s: number, i: any) => s + (i.unitCost ?? i.product?.costPrice ?? 0) * i.quantity, 0) || 0)}</td>
                <td className="p-3">{bom.isActive ? <span className="text-green-600 text-xs font-medium">{ta('Active')}</span> : <span className="text-red-600 text-xs font-medium">{ta('Inactive')}</span>}</td>
                <td className="p-3"><button className="text-xs text-navy hover:text-gold" onClick={() => setShowForm(showForm === bom.id ? null : bom.id)}>{ta('View')}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && showForm !== 'new' && (
        <div className="mt-4 bg-gray-50 rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-navy mb-3">{ta('BOM Details')}</h4>
          {(() => { const bom = items.find(b => b.id === showForm); if (!bom) return null
            return (
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">{ta('Product:')}</span> <span className="font-medium text-navy">{bom.product?.name}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">{ta('Version:')}</span> <span className="font-medium text-navy">{bom.version}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">{ta('Notes:')}</span> <span className="font-medium text-navy">{bom.notes || '-'}</span></p>
                <div className="mt-3"><h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{ta('Components')}</h5>
                  <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">{ta('Material')}</th><th className="pb-2 font-medium text-right">{ta('Qty')}</th><th className="pb-2 font-medium text-right">{ta('Unit Cost')}</th><th className="pb-2 font-medium text-right">{ta('Total')}</th><th className="pb-2 font-medium text-right">{ta('Scrap %')}</th></tr></thead>
                    <tbody>{bom.items?.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/50"><td className="py-2 text-navy font-medium">{item.product?.name}</td><td className="py-2 text-right">{fmtNum(item.quantity)}</td><td className="py-2 text-right">{formatCurrency(item.unitCost ?? item.product?.costPrice ?? 0)}</td><td className="py-2 text-right font-semibold">{formatCurrency((item.unitCost ?? item.product?.costPrice ?? 0) * item.quantity)}</td><td className="py-2 text-right">{fmtNum(item.scrapPct)}%</td></tr>
                    ))}</tbody></table>
                  <p className="text-right text-sm font-semibold text-navy mt-2">{ta('Total')}: {formatCurrency(bom.items?.reduce((s: number, i: any) => s + (i.unitCost ?? i.product?.costPrice ?? 0) * i.quantity * (1 + i.scrapPct / 100), 0) || 0)}</p>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function BomForm({ products, onDone }: { products: any[]; onDone: () => void }) {
  const { ta } = useAdminTranslate()
  const [productId, setProductId] = useState('')
  const [version, setVersion] = useState('1.0')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<any[]>([{ productId: '', quantity: '1', unitCost: '', scrapPct: '0' }])

  async function handleCreate() {
    try {
      const res = await fetch('/api/admin/accounting/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId, version, quantity: parseFloat(quantity), notes,
          items: items.map(i => ({ productId: i.productId, quantity: parseFloat(i.quantity), unitCost: parseFloat(i.unitCost) || undefined, scrapPct: parseFloat(i.scrapPct) || 0 })),
        }),
      })
      if (res.ok) { toast.success(ta('BOM created')); onDone() }
      else { const e = await res.json(); toast.error(e.error || ta('Failed')) }
    } catch { toast.error(ta('Failed to create BOM')) }
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-border p-4 mb-4 space-y-3">
      <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
        <option value="">{ta('Select Product')}</option>
        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
      </select>
      <div className="flex gap-2">
        <input value={version} onChange={e => setVersion(e.target.value)} placeholder={ta('Version')} className="w-24 px-3 py-2 border border-border rounded-lg text-sm" />
        <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" placeholder={ta('Output Qty')} className="w-28 px-3 py-2 border border-border rounded-lg text-sm" />
      </div>
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={ta('Notes (optional)')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground uppercase">{ta('Materials')}</span>
          <button onClick={() => setItems([...items, { productId: '', quantity: '1', unitCost: '', scrapPct: '0' }])} className="text-xs text-navy hover:text-gold flex items-center gap-1"><Plus className="h-3 w-3" /> {ta('Add')}</button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select value={item.productId} onChange={e => { const n = [...items]; n[i].productId = e.target.value; setItems(n) }} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">{ta('Select Material')}</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input value={item.quantity} onChange={e => { const n = [...items]; n[i].quantity = e.target.value; setItems(n) }} type="number" placeholder={ta('Qty')} className="w-20 px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={item.unitCost} onChange={e => { const n = [...items]; n[i].unitCost = e.target.value; setItems(n) }} type="number" placeholder={ta('Cost')} className="w-24 px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={item.scrapPct} onChange={e => { const n = [...items]; n[i].scrapPct = e.target.value; setItems(n) }} type="number" placeholder={ta('Scrap%')} className="w-20 px-3 py-2 border border-border rounded-lg text-sm" />
            {items.length > 1 && <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:text-red-700"><XCircle className="h-4 w-4" /></button>}
          </div>
        ))}
      </div>
      <div className="flex gap-2"><button onClick={handleCreate} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">{ta('Create BOM')}</button><button onClick={onDone} className="px-4 py-2 border border-border rounded-lg text-sm">{ta('Cancel')}</button></div>
    </div>
  )
}

function ProductionOrdersView() {
  const { ta, fmtNum, fmtDate } = useAdminTranslate()
  const [orders, setOrders] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [boms, setBoms] = useState<any[]>([])
  const [workCenters, setWorkCenters] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [materialProdId, setMaterialProdId] = useState('')
  const [materialQty, setMaterialQty] = useState('')
  const [materialCost, setMaterialCost] = useState('')
  const [laborHours, setLaborHours] = useState('')
  const [laborRate, setLaborRate] = useState('')
  const [laborDesc, setLaborDesc] = useState('')
  const [outputQty, setOutputQty] = useState('')
  const [outputCost, setOutputCost] = useState('')

  function fetchData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    Promise.all([
      fetch(`/api/admin/accounting/production-orders?${params}`).then(r => r.json()),
      fetch('/api/admin/accounting/manufacturing-summary').then(r => r.json()),
      fetch('/api/admin/products?all=true').then(r => r.json()).catch(() => ({ products: [] })),
      fetch('/api/admin/accounting/boms').then(r => r.json()),
      fetch('/api/admin/accounting/work-centers').then(r => r.json()),
    ]).then(([ords, summ, prods, b, wc]) => {
      setOrders(ords); setSummary(summ); setProducts(prods?.products || prods || [])
      setBoms(b); setWorkCenters(wc); setLoading(false)
    }).catch(() => { toast.error(ta('Failed to load')); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [statusFilter])

  async function handleAction(url: string, method: string, body?: any) {
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      if (res.ok) { toast.success(ta('Done')); fetchData(); setSelected(null) }
      else { const e = await res.json(); toast.error(e.error || ta('Failed')) }
    } catch { toast.error(ta('Failed')) }
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-40 w-full" /></div>

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-sm text-navy hover:text-gold mb-4 flex items-center gap-1"><XCircle className="h-4 w-4" /> {ta('Back')}</button>
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">{ta('Order #')}</p><p className="font-semibold text-navy">{selected.orderNumber}</p></div>
            <div><p className="text-muted-foreground">{ta('Product')}</p><p className="font-semibold text-navy">{selected.product?.name}</p></div>
            <div><p className="text-muted-foreground">{ta('Status')}</p><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${selected.status === 'completed' ? 'bg-green-100 text-green-700' : selected.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : selected.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{selected.status}</span></div>
            <div><p className="text-muted-foreground">{ta('Quantity')}</p><p className="font-semibold text-navy">{fmtNum(selected.completedQty)}/{fmtNum(selected.quantity)}</p></div>
          </div>
          {selected.materials?.length > 0 && (
            <div><h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{ta('Materials Issued')}</h4>
              <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">{ta('Material')}</th><th className="pb-2 font-medium text-right">{ta('Qty')}</th><th className="pb-2 font-medium text-right">{ta('Unit Cost')}</th><th className="pb-2 font-medium text-right">{ta('Total')}</th></tr></thead>
                <tbody>{selected.materials.map((m: any) => (
                  <tr key={m.id} className="border-b border-border/50"><td className="py-2 text-navy font-medium">{m.product?.name}</td><td className="py-2 text-right">{fmtNum(m.quantity)}</td><td className="py-2 text-right">{formatCurrency(m.unitCost)}</td><td className="py-2 text-right font-semibold">{formatCurrency(m.totalCost)}</td></tr>
                ))}</tbody></table>
            </div>
          )}
          {selected.laborEntries?.length > 0 && (
            <div><h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{ta('Labor')}</h4>
              <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">{ta('Description')}</th><th className="pb-2 font-medium text-right">{ta('Hours')}</th><th className="pb-2 font-medium text-right">{ta('Rate')}</th><th className="pb-2 font-medium text-right">{ta('Total')}</th></tr></thead>
                <tbody>{selected.laborEntries.map((l: any) => (
                  <tr key={l.id} className="border-b border-border/50"><td className="py-2 text-navy">{l.description || '-'}</td><td className="py-2 text-right">{fmtNum(l.hours)}</td><td className="py-2 text-right">{formatCurrency(l.rate)}</td><td className="py-2 text-right font-semibold">{formatCurrency(l.totalCost)}</td></tr>
                ))}</tbody></table>
            </div>
          )}
          {selected.outputs?.length > 0 && (
            <div><h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{ta('Outputs')}</h4>
              <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">{ta('Type')}</th><th className="pb-2 font-medium text-right">{ta('Qty')}</th><th className="pb-2 font-medium text-right">{ta('Unit Cost')}</th><th className="pb-2 font-medium text-right">{ta('Total')}</th></tr></thead>
                <tbody>{selected.outputs.map((o: any) => (
                  <tr key={o.id} className="border-b border-border/50"><td className="py-2 text-navy">{o.isScrap ? ta('Scrap') : ta('Finished Good')}</td><td className="py-2 text-right">{fmtNum(o.quantity)}</td><td className="py-2 text-right">{formatCurrency(o.unitCost)}</td><td className="py-2 text-right font-semibold">{formatCurrency(o.totalCost)}</td></tr>
                ))}</tbody></table>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-border pt-4">
            <div><p className="text-muted-foreground">{ta('Std Cost')}</p><p className="font-semibold text-navy">{formatCurrency(selected.standardCost)}</p></div>
            <div><p className="text-muted-foreground">{ta('Material Cost')}</p><p className="font-semibold text-blue-600">{formatCurrency(selected.actualMaterialCost)}</p></div>
            <div><p className="text-muted-foreground">{ta('Labor Cost')}</p><p className="font-semibold text-purple-600">{formatCurrency(selected.actualLaborCost)}</p></div>
            <div><p className="text-muted-foreground">{ta('Total Actual')}</p><p className="font-semibold text-amber-600">{formatCurrency(selected.actualMaterialCost + selected.actualLaborCost + selected.actualOverheadCost)}</p></div>
          </div>
          {selected.status === 'draft' && (
            <div className="flex gap-2 pt-2"><button onClick={() => handleAction(`/api/admin/accounting/production-orders/${selected.id}/start`, 'POST')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5"><Play className="h-4 w-4" /> {ta('Start Production')}</button>
              <button onClick={() => handleAction(`/api/admin/accounting/production-orders/${selected.id}/cancel`, 'POST')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1.5"><XCircle className="h-4 w-4" /> {ta('Cancel')}</button></div>
          )}
          {selected.status === 'in_progress' && (
            <div className="space-y-4 border-t border-border pt-4">
              <div><h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{ta('Issue Material')}</h5>
                <div className="flex gap-2">
                  <select value={materialProdId} onChange={e => setMaterialProdId(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"><option value="">{ta('Select Material')}</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <input value={materialQty} onChange={e => setMaterialQty(e.target.value)} type="number" placeholder={ta('Qty')} className="w-20 px-3 py-2 border border-border rounded-lg text-sm" />
                  <input value={materialCost} onChange={e => setMaterialCost(e.target.value)} type="number" placeholder={ta('Unit Cost')} className="w-24 px-3 py-2 border border-border rounded-lg text-sm" />
                  <button onClick={() => { handleAction(`/api/admin/accounting/production-orders/${selected.id}/issue-material`, 'POST', { productId: materialProdId, quantity: parseFloat(materialQty), unitCost: parseFloat(materialCost) || undefined }); setMaterialProdId(''); setMaterialQty(''); setMaterialCost('') }} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"><Package className="h-4 w-4" /></button>
                </div>
              </div>
              <div><h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{ta('Record Labor')}</h5>
                <div className="flex gap-2">
                  <input value={laborHours} onChange={e => setLaborHours(e.target.value)} type="number" placeholder={ta('Hours')} className="w-24 px-3 py-2 border border-border rounded-lg text-sm" />
                  <input value={laborRate} onChange={e => setLaborRate(e.target.value)} type="number" placeholder={ta('Rate/hr')} className="w-24 px-3 py-2 border border-border rounded-lg text-sm" />
                  <input value={laborDesc} onChange={e => setLaborDesc(e.target.value)} placeholder={ta('Description')} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
                  <button onClick={() => { handleAction(`/api/admin/accounting/production-orders/${selected.id}/record-labor`, 'POST', { hours: parseFloat(laborHours), rate: parseFloat(laborRate), description: laborDesc }); setLaborHours(''); setLaborRate(''); setLaborDesc('') }} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"><Wrench className="h-4 w-4" /></button>
                </div>
              </div>
              <div><h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{ta('Receive Output')}</h5>
                <div className="flex gap-2">
                  <input value={outputQty} onChange={e => setOutputQty(e.target.value)} type="number" placeholder={ta('Qty')} className="w-24 px-3 py-2 border border-border rounded-lg text-sm" />
                  <input value={outputCost} onChange={e => setOutputCost(e.target.value)} type="number" placeholder={ta('Unit Cost')} className="w-24 px-3 py-2 border border-border rounded-lg text-sm" />
                  <button onClick={() => { handleAction(`/api/admin/accounting/production-orders/${selected.id}/receive-output`, 'POST', { quantity: parseInt(outputQty), unitCost: parseFloat(outputCost) || 0, isScrap: false }); setOutputQty(''); setOutputCost('') }} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><CheckCircle className="h-4 w-4" /></button>
                </div>
              </div>
              <button onClick={() => handleAction(`/api/admin/accounting/production-orders/${selected.id}/complete`, 'POST')} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> {ta('Complete Order')}</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{ta('Total Orders')}</p><p className="text-xl font-bold text-navy">{fmtNum(summary.totalOrders)}</p></div>
          <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{ta('In Progress')}</p><p className="text-xl font-bold text-blue-600">{fmtNum(summary.inProgress)}</p></div>
          <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{ta('Completed')}</p><p className="text-xl font-bold text-green-600">{fmtNum(summary.completed)}</p></div>
          <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{ta('Total Actual')}</p><p className="text-xl font-bold text-amber-600">{formatCurrency(summary.totalActualCost)}</p></div>
          <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{ta('Variance')}</p><p className={`text-xl font-bold ${summary.variance <= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtNum(summary.variance, 2)}%</p></div>
        </div>
      )}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">{ta('All Statuses')}</option>
          <option value="draft">{ta('Draft')}</option>
          <option value="in_progress">{ta('In Progress')}</option>
          <option value="completed">{ta('Completed')}</option>
          <option value="cancelled">{ta('Cancelled')}</option>
        </select>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 transition-colors flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> {ta('New Order')}</button>
      </div>
      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-border p-4 mb-4">
          <NewOrderForm products={products} boms={boms} workCenters={workCenters} onDone={() => { setShowForm(false); fetchData() }} />
        </div>
      )}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border bg-gray-50"><th className="p-3 font-medium">{ta('Order #')}</th><th className="p-3 font-medium">{ta('Product')}</th><th className="p-3 font-medium text-right">{ta('Qty')}</th><th className="p-3 font-medium text-right">{ta('Completed')}</th><th className="p-3 font-medium">{ta('Status')}</th><th className="p-3 font-medium text-right">{ta('Std Cost')}</th><th className="p-3 font-medium text-right">{ta('Actual Cost')}</th><th className="p-3 font-medium">{ta('Created')}</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">{ta('No production orders')}</td></tr>}
            {orders.map((o: any) => (
              <tr key={o.id} className="border-b border-border/50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                <td className="p-3 font-mono text-xs text-muted-foreground">{o.orderNumber}</td>
                <td className="p-3 font-medium text-navy">{o.product?.name}</td>
                <td className="p-3 text-right">{fmtNum(o.quantity)}</td>
                <td className="p-3 text-right">{fmtNum(o.completedQty)}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{o.status}</span></td>
                <td className="p-3 text-right font-mono">{formatCurrency(o.standardCost)}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(o.actualMaterialCost + o.actualLaborCost + o.actualOverheadCost)}</td>
                <td className="p-3 text-xs text-muted-foreground">{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NewOrderForm({ products, boms, workCenters, onDone }: { products: any[]; boms: any[]; workCenters: any[]; onDone: () => void }) {
  const { ta } = useAdminTranslate()
  const [productId, setProductId] = useState('')
  const [bomId, setBomId] = useState('')
  const [workCenterId, setWorkCenterId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [plannedStart, setPlannedStart] = useState('')
  const [notes, setNotes] = useState('')

  async function handleCreate() {
    try {
      const res = await fetch('/api/admin/accounting/production-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, bomId: bomId || undefined, workCenterId: workCenterId || undefined, quantity: parseInt(quantity), plannedStart: plannedStart || undefined, notes }),
      })
      if (res.ok) { toast.success(ta('Production order created')); onDone() }
      else { const e = await res.json(); toast.error(e.error || ta('Failed')) }
    } catch { toast.error(ta('Failed')) }
  }

  return (
    <div className="space-y-3">
      <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="">{ta('Select Product')}</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div className="flex gap-2">
        <select value={bomId} onChange={e => setBomId(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"><option value="">{ta('No BOM')}</option>{boms.filter((b: any) => b.isActive).map((b: any) => <option key={b.id} value={b.id}>{b.product?.name} v{b.version}</option>)}</select>
        <select value={workCenterId} onChange={e => setWorkCenterId(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"><option value="">{ta('No Work Center')}</option>{workCenters.filter((w: any) => w.isActive).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
      </div>
      <div className="flex gap-2">
        <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" placeholder={ta('Quantity')} className="w-28 px-3 py-2 border border-border rounded-lg text-sm" />
        <input value={plannedStart} onChange={e => setPlannedStart(e.target.value)} type="date" placeholder={ta('Planned Start')} className="px-3 py-2 border border-border rounded-lg text-sm" />
      </div>
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={ta('Notes')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
      <div className="flex gap-2"><button onClick={handleCreate} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">{ta('Create')}</button><button onClick={onDone} className="px-4 py-2 border border-border rounded-lg text-sm">{ta('Cancel')}</button></div>
    </div>
  )
}
