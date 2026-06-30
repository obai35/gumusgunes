'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { EditorToolbar } from '@/components/admin/editor/EditorToolbar'
import SectionPanel from '@/components/admin/editor/SectionPanel'
import type { SectionKey } from '@/components/admin/editor/types'

export default function SiteEditor() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('theme')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [showPanel, setShowPanel] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { if (data.ok) setSettings(data.settings) })
      .finally(() => setLoading(false))
  }, [])

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }))
    fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }).catch(() => toast.error('Failed to save'))
    iframeRef.current?.contentWindow?.postMessage({ type: 'settings-update', key, value }, '*')
  }, [])

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
        iframeRef.current?.contentWindow?.location.reload()
      } else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }, [settings])

  const previewUrl = `/preview?t=${Date.now()}`

  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading editor...</div>

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
