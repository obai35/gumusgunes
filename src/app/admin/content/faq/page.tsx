'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, X } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'

type FaqEntry = {
  id: string; question: string; answer: string
  category: string; sortOrder: number; isActive: boolean
}

export default function FaqAdminPage() {
  const [entries, setEntries] = useState<FaqEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('General')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  function fetchEntries() {
    setLoading(true)
    fetch('/api/admin/content/faq')
      .then(r => r.json())
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load FAQ entries'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEntries() }, [])

  function resetForm() {
    setQuestion(''); setAnswer(''); setCategory('General'); setEditId(null)
  }

  async function handleSubmit() {
    if (!question || !answer) { toast.error('Question and answer are required'); return }
    setSaving(true)
    try {
      const url = editId ? `/api/admin/content/faq/${editId}` : '/api/admin/content/faq'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category }),
      })
      if (res.ok) {
        toast.success(editId ? 'FAQ updated' : 'FAQ created')
        resetForm(); setShowModal(false); fetchEntries()
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed')
      }
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/content/faq/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== deleteId))
        toast.success('FAQ entry deleted')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
    finally { setDeleteId(null) }
  }

  async function toggleActive(entry: FaqEntry) {
    const res = await fetch(`/api/admin/content/faq/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !entry.isActive }),
    })
    if (res.ok) {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isActive: !e.isActive } : e))
    } else toast.error('Failed to toggle')
  }

  async function handleDragEnd() {
    if (dragIndex === null) return
    setDragIndex(null)
    const reordered = entries.map((e, i) => ({ id: e.id, sortOrder: i }))
    const res = await fetch('/api/admin/content/faq/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered }),
    })
    if (!res.ok) { toast.error('Failed to save order'); fetchEntries() }
  }

  function openEdit(entry: FaqEntry) {
    setQuestion(entry.question); setAnswer(entry.answer)
    setCategory(entry.category); setEditId(entry.id); setShowModal(true)
  }

  const columns: ColumnDef<FaqEntry>[] = [
    {
      id: 'drag',
      header: '',
      size: 40,
      cell: ({ row }) => (
        <div
          draggable
          onDragStart={() => setDragIndex(row.index)}
          onDragOver={(e) => {
            e.preventDefault()
            if (dragIndex === null || dragIndex === row.index) return
            const reordered = [...entries]
            const [moved] = reordered.splice(dragIndex, 1)
            reordered.splice(row.index, 0, moved)
            setEntries(reordered)
            setDragIndex(row.index)
          }}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-navy p-1"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      ),
    },
    {
      accessorKey: 'question',
      header: 'Question',
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.question}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-xs px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground font-medium">{row.original.category}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => (
        <button
          onClick={() => toggleActive(row.original)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {row.original.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {row.original.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-lg text-navy hover:text-gold hover:bg-gray-50 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="FAQ Management"
        subtitle={`${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`}
        actions={
          <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-4 w-4" /> New FAQ
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        keyExtractor={e => e.id}
        emptyTitle="No FAQ entries yet"
        emptyDescription="Add frequently asked questions for your customers."
        emptyAction={{ label: 'New FAQ', onClick: () => { resetForm(); setShowModal(true) } }}
      />

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy">{editId ? 'Edit FAQ' : 'New FAQ'}</h3>
                <button onClick={() => { setShowModal(false); resetForm() }}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer" rows={4} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. Shipping, Returns)" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { setShowModal(false); resetForm() }} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
                <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={o => { if (!o) setDeleteId(null) }}
        title="Delete FAQ entry"
        description="Are you sure you want to delete this FAQ entry?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
