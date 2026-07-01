'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { EditorToolbar } from '@/components/admin/editor/EditorToolbar'
import SectionPanel from '@/components/admin/editor/SectionPanel'
import { Skeleton } from '@/components/admin/Skeleton'
import type { SectionKey } from '@/components/admin/editor/types'

function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((...args: any[]) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay]) as unknown as T
}

export default function SiteEditor() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('theme')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const previewWindowRef = useRef<Window | null>(null)
  const [showPanel, setShowPanel] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { if (data.ok) setSettings(data.settings) })
      .finally(() => setLoading(false))
  }, [])

  const postMessageToPreview = useCallback((key: string, value: string) => {
    previewWindowRef.current?.postMessage({ type: 'settings-update', key, value }, '*')
  }, [])

  const openPreview = useCallback(() => {
    const url = `/preview?t=${Date.now()}`
    const w = window.open(url, 'sitePreview', 'width=1200,height=900,scrollbars=yes')
    if (w) {
      previewWindowRef.current = w
      setPreviewOpen(true)
      const timer = setInterval(() => {
        if (w.closed) {
          previewWindowRef.current = null
          setPreviewOpen(false)
          clearInterval(timer)
        }
      }, 1000)
    }
  }, [])

  const persistSetting = useCallback(async (key: string, value: string) => {
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
    } catch { /* silent */ }
    postMessageToPreview(key, value)
  }, [postMessageToPreview])

  const debouncedPersist = useDebounce(persistSetting, 400)

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }))
    debouncedPersist(key, value)
  }, [debouncedPersist])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success('Settings saved')
        if (previewWindowRef.current && !previewWindowRef.current.closed) {
          previewWindowRef.current.location.href = `/preview?t=${Date.now()}`
        }
      } else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }, [settings])

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'section-clicked') {
        setActiveSection(event.data.section as SectionKey)
        setShowPanel(true)
      }
      if (event.data?.type === 'inline-update') {
        updateSetting(event.data.key, event.data.value)
      }
    }
    window.addEventListener('message', messageHandler)

    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        setShowPanel(p => !p)
      }
    }
    window.addEventListener('keydown', keyHandler)
    return () => {
      window.removeEventListener('message', messageHandler)
      window.removeEventListener('keydown', keyHandler)
    }
  }, [handleSave, updateSetting])

  if (loading) return (
    <div className="flex flex-col h-screen bg-gray-100 p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex gap-6 flex-1">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-[60vh] w-full" />
        </div>
        <Skeleton className="w-[400px] hidden lg:block" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <EditorToolbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        device={device}
        onDeviceChange={setDevice}
        onSave={handleSave}
        saving={saving}
      />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-200 gap-4">
          {!previewOpen ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">Open the preview window to see your changes in real-time.</p>
              <button
                onClick={openPreview}
                className="px-6 py-3 bg-navy text-silver rounded-lg font-medium hover:bg-navy-light transition-colors"
              >
                Open Preview
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Preview is open in a separate window.</p>
              <p className="text-xs text-muted-foreground">Edit settings below — changes update automatically.</p>
            </div>
          )}
        </div>
        {showPanel && (
          <SectionPanel
            section={activeSection}
            settings={settings}
            onSettingChange={updateSetting}
            onClose={() => setShowPanel(false)}
          />
        )}
      </div>
    </div>
  )
}
