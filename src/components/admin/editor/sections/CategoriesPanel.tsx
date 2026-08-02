'use client'

import { useEditor } from '../SectionPanel'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export function CategoriesPanel() {
  const { settings, updateSetting } = useEditor()
  const { ta } = useAdminTranslate()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Section Title')}</label>
        <input value={g('categoriesTitle') || ta('Shop by Category')} onChange={e => updateSetting('categoriesTitle', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Layout')}</label>
        <select value={g('categoriesLayout') || 'grid'} onChange={e => updateSetting('categoriesLayout', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
          <option value="grid">{ta('Grid')}</option>
          <option value="carousel">{ta('Carousel')}</option>
          <option value="list">{ta('List')}</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Columns (Desktop)')}</label>
        <select value={g('categoriesColumns') || '4'} onChange={e => updateSetting('categoriesColumns', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Max Categories to Show')}</label>
        <input type="number" min="1" max="50" value={parseInt(g('categoriesMax')) || 8} onChange={e => updateSetting('categoriesMax', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={g('categoriesShowCount') !== 'false'} onChange={e => updateSetting('categoriesShowCount', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
        <label className="text-xs font-medium text-muted-foreground">{ta('Show Product Count')}</label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={g('categoriesShowImages') !== 'false'} onChange={e => updateSetting('categoriesShowImages', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
        <label className="text-xs font-medium text-muted-foreground">{ta('Show Category Images')}</label>
      </div>
    </div>
  )
}
