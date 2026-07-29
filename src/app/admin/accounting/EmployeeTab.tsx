'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, X } from 'lucide-react'
import { formatCurrency } from './format'

export default function EmployeeTab() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', position: '', salary: 0, bankAccountName: '', bankAccountNumber: '', bankName: '', taxId: '', notes: '' })

  function fetchEmployees() {
    setLoading(true)
    fetch('/api/admin/accounting/employees')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setEmployees(d.employees || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load employees'); setLoading(false) })
  }

  useEffect(() => { fetchEmployees() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', position: '', salary: 0, bankAccountName: '', bankAccountNumber: '', bankName: '', taxId: '', notes: '' })
    setShowModal(true)
  }

  function openEdit(emp: any) {
    setEditing(emp)
    setForm({ name: emp.name, email: emp.email || '', phone: emp.phone || '', position: emp.position || '', salary: emp.salary, bankAccountName: emp.bankAccountName || '', bankAccountNumber: emp.bankAccountNumber || '', bankName: emp.bankName || '', taxId: emp.taxId || '', notes: emp.notes || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name) { toast.error('Name is required'); return }
    try {
      const res = await fetch('/api/admin/accounting/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Employee updated' : 'Employee created')
      setShowModal(false)
      fetchEmployees()
    } catch { toast.error('Failed to save') }
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-navy">Employees</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Position</th>
              <th className="p-3 font-medium text-right">Salary</th>
              <th className="p-3 font-medium">Bank</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No employees yet</td></tr>}
            {employees.map(emp => (
              <tr key={emp.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{emp.name}</td>
                <td className="p-3 text-muted-foreground">{emp.position || '-'}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(emp.salary)}</td>
                <td className="p-3 text-muted-foreground">{emp.bankName ? `${emp.bankName} / ${emp.bankAccountNumber}` : '-'}</td>
                <td className="p-3">
                  <button onClick={() => openEdit(emp)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                    <Pencil className="h-3 w-3 inline mr-1" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-navy">{editing ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-muted-foreground hover:text-navy" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Position</label>
                <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Salary (EGP)</label>
                <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div className="col-span-2 border-t border-border pt-3">
                <p className="text-xs font-medium text-navy mb-2">Bank Details (for payroll)</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bank Name</label>
                <input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account Number</label>
                <input value={form.bankAccountNumber} onChange={e => setForm({ ...form, bankAccountNumber: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
