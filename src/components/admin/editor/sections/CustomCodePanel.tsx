'use client'

import { useEditor } from '../SectionPanel'

export default function CustomCodePanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Custom CSS</label>
        <p className="text-[10px] text-muted-foreground mb-1">Injected into &lt;head&gt;</p>
        <textarea value={g('custom_css')} onChange={e => updateSetting('custom_css', e.target.value)} rows={8} className="w-full px-2 py-1.5 text-xs font-mono border border-border rounded" placeholder="/* Add your custom CSS here */" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Custom JS (before &lt;/body&gt;)</label>
        <textarea value={g('custom_js')} onChange={e => updateSetting('custom_js', e.target.value)} rows={8} className="w-full px-2 py-1.5 text-xs font-mono border border-border rounded" placeholder="// Add your custom JS here" />
      </div>
    </div>
  )
}
