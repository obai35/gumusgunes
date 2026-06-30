'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [showPanel, setShowPanel] = useState(true)
  const iframeKey = useRef(0)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { if (data.ok) setSettings(data.settings) })
      .finally(() => setLoading(false))
  }, [])

  const persistSetting = useCallback(async (key: string, value: string) => {
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
    } catch { /* silent */ }
    iframeRef.current?.contentWindow?.postMessage({ type: 'settings-update', key, value }, '*')
  }, [])

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
        iframeKey.current++
        iframeRef.current?.contentWindow?.location.reload()
      } else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }, [settings])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        setShowPanel(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  const previewUrl = useMemo(() => `/preview?t=${Date.now()}`, [])

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

  const deviceWidth = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '100%'

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
        <div className="flex-1 flex items-start justify-center overflow-auto p-4 bg-gray-200">
          <div className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300" style={{ width: deviceWidth, maxWidth: '100%' }}>
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full border-0"
              style={{ height: 'calc(100vh - 120px)' }}
              title="Preview"
              key={iframeKey.current}
            />
          </div>
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
