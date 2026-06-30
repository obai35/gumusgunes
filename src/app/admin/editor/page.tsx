'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Eye, EyeOff, Save, Type, Palette, Image, Layout, Text, ChevronDown, ChevronUp,
  Globe, Tag, ShoppingBag,
} from 'lucide-react'

type Settings = Record<string, string>
type SectionKey = 'branding' | 'hero' | 'announcement' | 'design' | 'navigation' | 'footer'

const sections: { key: SectionKey; label: string; icon: any; fields: { key: string; label: string; type: 'text' | 'color' | 'font' | 'textarea' | 'image' | 'boolean' }[] }[] = [
  {
    key: 'branding', label: 'Branding', icon: Tag,
    fields: [
      { key: 'siteName', label: 'Site Name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'logoUrl', label: 'Logo URL', type: 'image' },
    ],
  },
  {
    key: 'hero', label: 'Hero Section', icon: Layout,
    fields: [
      { key: 'heroTitle', label: 'Hero Title', type: 'text' },
      { key: 'heroSubtitle', label: 'Hero Subtitle', type: 'text' },
      { key: 'heroBackground', label: 'Hero Background (image URL)', type: 'image' },
    ],
  },
  {
    key: 'announcement', label: 'Announcement Bar', icon: ShoppingBag,
    fields: [
      { key: 'announcementText', label: 'Announcement Text', type: 'text' },
      { key: 'announcementEnabled', label: 'Show Announcement', type: 'boolean' },
    ],
  },
  {
    key: 'design', label: 'Design / Theme', icon: Palette,
    fields: [
      { key: 'primaryFont', label: 'Primary Font', type: 'font' },
      { key: 'headingFont', label: 'Heading Font', type: 'font' },
      { key: 'primaryColor', label: 'Primary Color', type: 'color' },
      { key: 'accentColor', label: 'Accent / Gold Color', type: 'color' },
      { key: 'bgColor', label: 'Background Color', type: 'color' },
      { key: 'textColor', label: 'Text Color', type: 'color' },
    ],
  },
  {
    key: 'navigation', label: 'Navigation', icon: Globe,
    fields: [
      { key: 'navLabelWomen', label: 'Women Tab Label', type: 'text' },
      { key: 'navLabelMen', label: 'Men Tab Label', type: 'text' },
      { key: 'navLabelChildren', label: 'Children Tab Label', type: 'text' },
    ],
  },
  {
    key: 'footer', label: 'Footer', icon: Text,
    fields: [
      { key: 'footerText', label: 'Footer Text', type: 'text' },
      { key: 'footerEmail', label: 'Footer Email', type: 'text' },
      { key: 'footerPhone', label: 'Footer Phone', type: 'text' },
    ],
  },
]

const fontOptions = ['Inter', 'Playfair Display', 'Poppins', 'Montserrat', 'Lora', 'Roboto', 'DM Serif Display', 'Raleway', 'Merriweather']

export default function SiteEditor() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionKey>('branding')
  const [showPreview, setShowPreview] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    branding: true, hero: false, announcement: false, design: false, navigation: false, footer: false,
  })

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      if (data.ok && data.settings) {
        setSettings(data.settings)
      }
    }).finally(() => setLoading(false))
  }, [])

  const updateSetting = useCallback(async (key: string, value: string) => {
    const prev = { ...settings }
    setSettings(s => ({ ...s, [key]: value }))
    setSaving(key)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (!res.ok) { setSettings(prev); toast.error('Failed to save') }
    } catch { setSettings(prev) }
    setSaving(null)
  }, [settings])

  const getVal = (key: string) => settings[key] ?? ''

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>

  return (
    <div className="flex gap-6 h-[calc(100vh-48px)]">
      {/* Left: Live Preview */}
      {showPreview && (
        <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-gray-50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Preview</span>
            <button onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-navy"><EyeOff className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: getVal('bgColor') || '#faf8f5', color: getVal('textColor') || '#1a1a2e' }}>
            {/* Preview Content */}
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Branding Preview */}
              <div className="text-center border-2 border-dashed border-gray-200 rounded-xl p-8 relative group hover:border-gold/50 transition-colors cursor-pointer" onClick={() => setActiveSection('branding')}>
                <div className="absolute -top-2.5 left-3 bg-white px-2 text-xs font-medium text-muted-foreground">Branding</div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  {getVal('logoUrl') && (
                    <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-gold/30">
                      <img src={getVal('logoUrl')} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <span className="text-2xl font-bold" style={{ fontFamily: getVal('headingFont') || 'inherit' }}>
                    {getVal('siteName') || 'Gümüş Güneş'}
                  </span>
                </div>
                <p className="text-sm" style={{ color: getVal('textColor') || '#6b7280' }}>
                  {getVal('tagline') || 'Silver Sun Jewelry'}
                </p>
              </div>

              {/* Announcement Preview */}
              {getVal('announcementEnabled') !== 'false' && getVal('announcementText') && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center relative group hover:border-gold/50 transition-colors cursor-pointer" onClick={() => setActiveSection('announcement')}>
                  <div className="absolute -top-2.5 left-3 bg-white px-2 text-xs font-medium text-muted-foreground">Announcement</div>
                  <p className="text-sm font-medium" style={{ fontFamily: getVal('primaryFont') || 'inherit' }}>
                    {getVal('announcementText')}
                  </p>
                </div>
              )}

              {/* Hero Preview */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center relative group hover:border-gold/50 transition-colors cursor-pointer" style={getVal('heroBackground') ? { backgroundImage: `url(${getVal('heroBackground')})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} onClick={() => setActiveSection('hero')}>
                <div className="absolute -top-2.5 left-3 bg-white px-2 text-xs font-medium text-muted-foreground">Hero</div>
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: getVal('headingFont') || 'inherit', color: getVal('heroBackground') ? '#fff' : getVal('textColor') }}>
                  {getVal('heroTitle') || 'Discover Timeless Elegance'}
                </h1>
                <p className="text-sm" style={{ color: getVal('heroBackground') ? '#eee' : (getVal('textColor') || '#6b7280') }}>
                  {getVal('heroSubtitle') || 'Handcrafted jewelry for every moment'}
                </p>
              </div>

              {/* Design Preview */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 relative group hover:border-gold/50 transition-colors cursor-pointer" onClick={() => setActiveSection('design')}>
                <div className="absolute -top-2.5 left-3 bg-white px-2 text-xs font-medium text-muted-foreground">Theme</div>
                <div className="flex gap-4 items-center mb-3">
                  <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: getVal('primaryColor') || '#1a1a2e' }} />
                  <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: getVal('accentColor') || '#c8a97e' }} />
                  <span className="text-sm" style={{ fontFamily: getVal('primaryFont') || 'inherit' }}>Primary Font: {getVal('primaryFont') || 'Inter'}</span>
                  <span className="text-sm" style={{ fontFamily: getVal('headingFont') || 'inherit' }}>Heading Font: {getVal('headingFont') || 'Playfair Display'}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded" style={{ backgroundColor: getVal('primaryColor') || '#1a1a2e', color: '#fff' }}>Primary</span>
                  <span className="px-2 py-1 rounded" style={{ backgroundColor: getVal('accentColor') || '#c8a97e', color: '#fff' }}>Accent</span>
                  <span className="px-2 py-1 rounded border" style={{ backgroundColor: getVal('bgColor') || '#faf8f5' }}>Background</span>
                  <span className="px-2 py-1 rounded border" style={{ color: getVal('textColor') || '#1a1a2e' }}>Text</span>
                </div>
              </div>

              {/* Navigation Preview */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 relative group hover:border-gold/50 transition-colors cursor-pointer" onClick={() => setActiveSection('navigation')}>
                <div className="absolute -top-2.5 left-3 bg-white px-2 text-xs font-medium text-muted-foreground">Navigation</div>
                <div className="flex gap-4 justify-center">
                  {['Women', 'Men', 'Children'].map(cat => (
                    <span key={cat} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100">{getVal(`navLabel${cat}`) || cat}</span>
                  ))}
                </div>
              </div>

              {/* Footer Preview */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center relative group hover:border-gold/50 transition-colors cursor-pointer" onClick={() => setActiveSection('footer')}>
                <div className="absolute -top-2.5 left-3 bg-white px-2 text-xs font-medium text-muted-foreground">Footer</div>
                <p className="text-sm">{getVal('footerText') || '© Gümüş Güneş. All rights reserved.'}</p>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
                  <span>{getVal('footerEmail') || 'info@gumusgunes.com'}</span>
                  <span>{getVal('footerPhone') || '+20 100 000 0000'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview toggle button when hidden */}
      {!showPreview && (
        <button onClick={() => setShowPreview(true)} className="fixed bottom-6 left-6 z-10 px-4 py-2 bg-navy text-silver rounded-lg shadow-lg text-sm flex items-center gap-2 hover:bg-navy/90">
          <Eye className="h-4 w-4" /> Show Preview
        </button>
      )}

      {/* Right: Controls Panel */}
      <div className={`${showPreview ? 'w-[400px]' : 'w-full max-w-2xl mx-auto'} flex flex-col bg-white rounded-xl border border-border overflow-hidden shrink-0`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-50">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Editor Controls</span>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: '__refresh__', value: Date.now().toString() }) })
              toast.success('Settings saved')
            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90">
              <Save className="h-3.5 w-3.5" /> Save All
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sections.map(section => (
            <div key={section.key} className="border-b border-border/50">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-gray-50 transition-colors ${activeSection === section.key ? 'bg-gold/5 text-navy' : 'text-muted-foreground'}`}
              >
                <span className="flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </span>
                {expandedSections[section.key] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections[section.key] && (
                <div className="px-4 pb-4 space-y-3">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        <span>{field.label}</span>
                        {saving === field.key && <span className="text-gold text-[10px]">saving...</span>}
                      </label>
                      {field.type === 'color' && (
                        <div className="flex gap-2 mt-1">
                          <input type="color" value={getVal(field.key) || '#000000'} onChange={e => updateSetting(field.key, e.target.value)} className="h-9 w-12 rounded cursor-pointer border border-border" />
                          <input type="text" value={getVal(field.key) || ''} onChange={e => updateSetting(field.key, e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-border text-xs font-mono" placeholder="#000000" />
                        </div>
                      )}
                      {field.type === 'font' && (
                        <select value={getVal(field.key) || ''} onChange={e => updateSetting(field.key, e.target.value)} className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border text-sm">
                          <option value="">Default</option>
                          {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      )}
                      {field.type === 'boolean' && (
                        <button
                          onClick={() => updateSetting(field.key, getVal(field.key) === 'false' ? 'true' : 'false')}
                          className={`mt-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${getVal(field.key) !== 'false' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-muted-foreground'}`}
                        >
                          {getVal(field.key) !== 'false' ? 'Enabled' : 'Disabled'}
                        </button>
                      )}
                      {field.type === 'image' && (
                        <div className="mt-1 space-y-1">
                          <input type="text" value={getVal(field.key) || ''} onChange={e => updateSetting(field.key, e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-border text-sm" placeholder="/logo.png" />
                          {getVal(field.key) && (
                            <div className="h-12 w-12 rounded-lg overflow-hidden border border-border">
                              <img src={getVal(field.key)} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            </div>
                          )}
                        </div>
                      )}
                      {field.type === 'text' && (
                        <input type="text" value={getVal(field.key) || ''} onChange={e => updateSetting(field.key, e.target.value)} className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border text-sm" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
