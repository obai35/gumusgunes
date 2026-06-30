'use client'

import { useEditor } from '../SectionPanel'

const FONT_OPTIONS = ['Inter', 'Playfair Display', 'Poppins', 'Montserrat', 'Lora', 'Roboto', 'DM Serif Display', 'Raleway', 'Merriweather']
function fontFamily(name: string, isHeading: boolean) { return `'${name}', ${isHeading ? 'serif' : 'sans-serif'}` }

export function ThemePanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {['primaryColor', 'accentColor', 'bgColor', 'textColor'].map(key => (
          <div key={key}>
            <label className="text-xs font-medium text-muted-foreground capitalize">{key.replace('Color', ' Color')}</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={g(key) || '#000000'} onChange={e => updateSetting(key, e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-border" />
              <input value={g(key)} onChange={e => updateSetting(key, e.target.value)} className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono" />
            </div>
          </div>
        ))}
      </div>
      {['primaryFont', 'headingFont'].map(key => (
        <div key={key}>
          <label className="text-xs font-medium text-muted-foreground capitalize">{key.replace('Font', ' Font')}</label>
          <select value={g(key)} onChange={e => updateSetting(key, e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
            {FONT_OPTIONS.map(f => <option key={f} value={fontFamily(f, key === 'headingFont')}>{f}</option>)}
          </select>
        </div>
      ))}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Border Radius</label>
        <input type="range" min="0" max="24" value={parseInt(g('borderRadius')) || 8} onChange={e => updateSetting('borderRadius', e.target.value)} className="w-full mt-1" />
        <span className="text-xs text-muted-foreground">{g('borderRadius') || 8}px</span>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Button Style</label>
        <select value={g('buttonStyle') || 'solid'} onChange={e => updateSetting('buttonStyle', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
          <option value="solid">Solid</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>
    </div>
  )
}
