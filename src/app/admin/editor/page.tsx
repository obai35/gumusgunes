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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeKey = useRef(0)
  const [showPanel, setShowPanel] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { if (data.ok) setSettings(data.settings) })
      .finally(() => setLoading(false))
  }, [])

  const postMessageToPreview = useCallback((key: string, value: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'settings-update', key, value }, '*')
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
        iframeKey.current++
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
    <div className="flex flex-col h-full bg-gray-100 p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex gap-6 flex-1">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-[60vh] w-full" />
        </div>
        <Skeleton className="w-[400px]" />
      </div>
    </div>
  )

  const deviceWidth = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '100%'
  const iframeHeight = device === 'mobile' ? '667px' : device === 'tablet' ? '1024px' : 'calc(100vh - 140px)'

  return (
    <div className="flex flex-col h-full bg-gray-100">
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
              src={`/preview?t=${Date.now()}`}
              className="w-full border-0"
              style={{ height: iframeHeight }}
              title="Preview"
              key={iframeKey.current}
            />
          </div>
        </div>
        <SectionPanel
          section={activeSection}
          settings={settings}
          onSettingChange={updateSetting}
          onClose={() => setShowPanel(false)}
        />
      </div>
    </div>
  )
}
