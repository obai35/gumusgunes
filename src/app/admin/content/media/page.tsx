'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, Trash2, Copy, FileImage, Loader2, Check, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type MediaFile = {
  name: string; url: string; size: number; uploadedAt: string
}

export default function MediaPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function fetchFiles() {
    setLoading(true)
    fetch('/api/admin/content/media')
      .then(r => r.json())
      .then(d => setFiles(d.files || []))
      .catch(() => toast.error(ta('Failed to load media')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchFiles() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/content/media', { method: 'POST', body: formData })
      const d = await res.json()
      if (d.ok) {
        toast.success(ta('File uploaded'))
        fetchFiles()
      } else {
        toast.error(d.error || ta('Failed to upload'))
      }
    } catch { toast.error(ta('Failed to upload')) }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
    toast.success(ta('URL copied'))
  }

  async function handleDelete() {
    if (!deleteName) return
    try {
      const res = await fetch(`/api/admin/content/media?name=${encodeURIComponent(deleteName)}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.ok) {
        setFiles(prev => prev.filter(f => f.name !== deleteName))
        toast.success(ta('File deleted'))
      } else {
        toast.error(d.error || ta('Failed to delete'))
      }
    } catch { toast.error(ta('Failed to delete')) }
    finally { setDeleteName(null) }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <PageHeader
        title={ta('Media Gallery')}
        subtitle={`${files.length} ${ta(files.length !== 1 ? 'files' : 'file')}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchFiles} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> {ta('Refresh')}
            </button>
            <label className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? ta('Uploading...') : ta('Upload')}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20">
          <FileImage className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">{ta('No files uploaded yet')}</p>
          <p className="text-sm text-muted-foreground/70 mb-4">{ta('Upload images to use in blog posts, banners, and pages.')}</p>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 cursor-pointer">
            <Upload className="h-4 w-4" /> {ta('Upload First File')}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map(file => (
            <div key={file.name} className="group relative bg-white rounded-xl border border-border/60 overflow-hidden hover:shadow-md transition-all">
              <div className="aspect-square overflow-hidden">
                <img src={file.url} alt={file.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground/60">{formatSize(file.size)}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyUrl(file.url)}
                  className="p-1.5 rounded-lg bg-white/90 shadow-sm text-muted-foreground hover:text-navy transition-colors"
                  title={ta('Copy URL')}
                >
                  {copiedUrl === file.url ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setDeleteName(file.name)}
                  className="p-1.5 rounded-lg bg-white/90 shadow-sm text-red-400 hover:text-red-600 transition-colors"
                  title={ta('Delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteName !== null}
        onOpenChange={o => { if (!o) setDeleteName(null) }}
        title={ta('Delete file')}
        description={ta('Are you sure you want to delete this file? This cannot be undone.')}
        confirmLabel={ta('Delete')}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
