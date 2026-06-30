'use client'

import { ChevronDown, Monitor, Tablet, Smartphone, Save, LogOut } from 'lucide-react'
import { EDITOR_SECTIONS, type SectionKey } from './types'

type Device = 'desktop' | 'tablet' | 'mobile'

type Props = {
  activeSection: SectionKey
  onSectionChange: (key: SectionKey) => void
  device: Device
  onDeviceChange: (device: Device) => void
  onSave: () => void
  saving: boolean
}

const DEVICES = [
  { key: 'desktop' as const, icon: Monitor, label: 'Desktop' },
  { key: 'tablet' as const, icon: Tablet, label: 'Tablet' },
  { key: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
]

export function EditorToolbar({ activeSection, onSectionChange, device, onDeviceChange, onSave, saving }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border shrink-0 gap-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={activeSection}
            onChange={e => onSectionChange(e.target.value as SectionKey)}
            className="appearance-none bg-gray-100 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-navy outline-none cursor-pointer"
          >
            {EDITOR_SECTIONS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {DEVICES.map(d => (
          <button
            key={d.key}
            onClick={() => onDeviceChange(d.key)}
            className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
              device === d.key ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'
            }`}
          >
            <d.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{d.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <a
          href="/admin"
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-navy"
        >
          <LogOut className="h-3.5 w-3.5" />
          Exit
        </a>
      </div>
    </div>
  )
}
