'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Check, Eye, Copy } from 'lucide-react'

const PRESETS = [
  { name: 'Gold Elegance', colors: { primaryColor: '#C8A97E', secondaryColor: '#1a1a2e', accentColor: '#e2b14a' } },
  { name: 'Modern Dark', colors: { primaryColor: '#0f0f0f', secondaryColor: '#ffffff', accentColor: '#6366f1' } },
  { name: 'Rose Luxury', colors: { primaryColor: '#e8a0b4', secondaryColor: '#2d1b1f', accentColor: '#c48395' } },
  { name: 'Ocean Breeze', colors: { primaryColor: '#0ea5e9', secondaryColor: '#0f172a', accentColor: '#38bdf8' } },
  { name: 'Emerald', colors: { primaryColor: '#059669', secondaryColor: '#022c22', accentColor: '#34d399' } },
  { name: 'Lavender', colors: { primaryColor: '#8b5cf6', secondaryColor: '#1e1b4b', accentColor: '#a78bfa' } },
  { name: 'Warm Amber', colors: { primaryColor: '#d97706', secondaryColor: '#1c1917', accentColor: '#f59e0b' } },
  { name: 'Crimson', colors: { primaryColor: '#dc2626', secondaryColor: '#0a0a0a', accentColor: '#ef4444' } },
  { name: 'Teal', colors: { primaryColor: '#0d9488', secondaryColor: '#042f2e', accentColor: '#14b8a6' } },
  { name: 'Minimal White', colors: { primaryColor: '#18181b', secondaryColor: '#fafafa', accentColor: '#3b82f6' } },
]

const FONTS = [
  { name: 'Inter', category: 'Sans-serif' },
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Cormorant Garamond', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'DM Sans', category: 'Sans-serif' },
  { name: 'Poppins', category: 'Sans-serif' },
  { name: 'Space Grotesk', category: 'Sans-serif' },
  { name: 'Fraunces', category: 'Serif' },
]

export default function ThemeDesignerPage({ params }: { params: { id: string } }) {
  const [store, setStore] = useState<any>(null)
  const [theme, setTheme] = useState({
    primaryColor: '#C8A97E',
    secondaryColor: '#1a1a2e',
    accentColor: '#e2b14a',
    borderRadius: '0.5rem',
    fontFamily: 'Inter',
    logoUrl: '',
    faviconUrl: '',
    layoutType: 'multi-page' as 'single-page' | 'multi-page',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/stores/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setStore(data.store)
        if (data.store.theme || data.store.primaryColor) {
          setTheme(t => ({
            ...t,
            primaryColor: data.store.primaryColor || t.primaryColor,
            secondaryColor: data.store.secondaryColor || t.secondaryColor,
            accentColor: data.store.accentColor || t.accentColor,
            borderRadius: data.store.borderRadius || t.borderRadius,
            fontFamily: data.store.fontFamily || t.fontFamily,
            logoUrl: data.store.logoUrl || t.logoUrl,
            faviconUrl: data.store.faviconUrl || t.faviconUrl,
            layoutType: data.store.layoutType || t.layoutType,
          }))
        }
      })
  }, [params.id])

  function applyPreset(preset: typeof PRESETS[0]) {
    setTheme(t => ({ ...t, ...preset.colors }))
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/stores/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        borderRadius: theme.borderRadius,
        fontFamily: theme.fontFamily,
        logoUrl: theme.logoUrl || null,
        layoutType: theme.layoutType,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function getExportConfig() {
    return {
      storeName: store?.name || 'My Store',
      layout: theme.layoutType,
      theme: {
        colors: {
          primary: theme.primaryColor,
          secondary: theme.secondaryColor,
          accent: theme.accentColor,
        },
        typography: {
          fontFamily: theme.fontFamily,
        },
        borderRadius: theme.borderRadius,
        logoUrl: theme.logoUrl || undefined,
      },
      exportDate: new Date().toISOString(),
    }
  }

  function handleExport() {
    const config = getExportConfig()
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${store?.slug || 'store'}-theme.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCopyConfig() {
    navigator.clipboard.writeText(JSON.stringify(getExportConfig(), null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Live preview styles
  const previewStyle = {
    '--preview-primary': theme.primaryColor,
    '--preview-secondary': theme.secondaryColor,
    '--preview-accent': theme.accentColor,
    '--preview-radius': theme.borderRadius,
    '--preview-font': theme.fontFamily,
  } as React.CSSProperties

  if (!store) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

  return (
    <div style={previewStyle} className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="p-4 max-w-7xl mx-auto flex items-center justify-between">
          <Link href={`/stores/${params.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to {store.name}
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleCopyConfig}
              className="border px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors inline-flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy Config'}
            </button>
            <button onClick={handleExport}
              className="border px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors inline-flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button onClick={handleSave} disabled={saving}
              className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5">
              {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : saving ? 'Saving...' : 'Save Theme'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Controls Panel ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Presets */}
          <div className="bg-card border rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-3">Color Presets</h2>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)}
                  className="group relative h-8 w-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: p.colors.primaryColor }}
                  title={p.name}>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Colors</h2>
            {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map(k => (
              <div key={k}>
                <label className="block text-xs text-muted-foreground mb-1">
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme[k]}
                    onChange={e => setTheme(t => ({ ...t, [k]: e.target.value }))}
                    className="h-8 w-10 rounded border cursor-pointer shrink-0" />
                  <input value={theme[k]}
                    onChange={e => setTheme(t => ({ ...t, [k]: e.target.value }))}
                    className="flex-1 border rounded-lg px-2 py-1.5 text-xs font-mono bg-background" />
                </div>
              </div>
            ))}
          </div>

          {/* Logo */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Logo</h2>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Logo URL</label>
              <input value={theme.logoUrl}
                onChange={e => setTheme(t => ({ ...t, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="w-full border rounded-lg px-2 py-1.5 text-xs bg-background" />
            </div>
            {theme.logoUrl && (
              <div className="border rounded-lg p-2 flex items-center justify-center bg-white/5">
                <img src={theme.logoUrl} alt="Logo preview" className="max-h-12 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>

          {/* Typography */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Typography</h2>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button key={f.name} onClick={() => setTheme(t => ({ ...t, fontFamily: f.name }))}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${theme.fontFamily === f.name ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                  style={{ fontFamily: f.name }}>
                  <span style={{ fontFamily: f.name }} className="text-sm block truncate">{f.name}</span>
                  <span className="text-[10px] text-muted-foreground">{f.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <h2 className="font-semibold text-sm">Border Radius</h2>
            <input type="range" min="0" max="2" step="0.125" value={parseFloat(theme.borderRadius)}
              onChange={e => {
                const v = e.target.value
                const rem = `${v}rem`
                setTheme(t => ({ ...t, borderRadius: rem }))
              }}
              className="w-full" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0rem</span>
              <span className="font-mono">{theme.borderRadius}</span>
              <span>2rem</span>
            </div>
          </div>

          {/* Layout Type */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Layout Type</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTheme(t => ({ ...t, layoutType: 'single-page' }))}
                className={`p-3 rounded-lg border text-left transition-colors ${theme.layoutType === 'single-page' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                <p className="text-sm font-medium">Single-Page Landing</p>
                <p className="text-xs text-muted-foreground mt-0.5">One long scrollable page, all sections in sequence — hero, products, about, contact</p>
              </button>
              <button onClick={() => setTheme(t => ({ ...t, layoutType: 'multi-page' }))}
                className={`p-3 rounded-lg border text-left transition-colors ${theme.layoutType === 'multi-page' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                <p className="text-sm font-medium">Multi-Page</p>
                <p className="text-xs text-muted-foreground mt-0.5">Separate pages for products, cart, checkout, blog, FAQ, about, and admin</p>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Live Preview ─── */}
        <div className="lg:col-span-3">
          <div className="sticky top-20">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Live Preview</h2>
            </div>

            {/* Phone-sized preview */}
            <div className="border rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-zinc-900"
              style={{
                fontFamily: theme.fontFamily,
                borderRadius: 'calc(1rem * var(--radius-multiplier, 1))',
                '--radius-multiplier': parseFloat(theme.borderRadius) / 0.5,
              } as React.CSSProperties}>
              {/* Navbar */}
              <div className="px-5 py-3 flex items-center justify-between border-b"
                style={{ backgroundColor: theme.secondaryColor, borderColor: 'transparent' }}>
                <div className="flex items-center gap-2">
                  {theme.logoUrl ? (
                    <img src={theme.logoUrl} alt="Logo" className="h-6 object-contain" />
                  ) : (
                    <span style={{ color: theme.primaryColor, fontWeight: 700, fontSize: 15 }}>
                      {store?.name || 'Store Name'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: '#ffffff90', fontSize: 11 }}>Shop</span>
                  <span style={{ color: '#ffffff90', fontSize: 11 }}>About</span>
                  <div className="h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.accentColor }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>3</span>
                  </div>
                </div>
              </div>

              {/* Hero Section */}
              <div className="px-5 py-8 text-center"
                style={{ backgroundColor: theme.secondaryColor }}>
                <h1 className="text-xl font-bold mb-2" style={{ color: '#ffffff' }}>
                  {theme.layoutType === 'single-page' ? 'Elegant Jewelry' : 'Welcome'}
                </h1>
                <p className="text-xs mb-4" style={{ color: '#ffffff90' }}>
                  {theme.layoutType === 'single-page'
                    ? 'Discover our collection — scroll down to explore rings, necklaces, and more.'
                    : 'Browse our collection of fine jewelry.'}
                </p>
                <span className="inline-block px-4 py-1.5 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>
                  Shop Now
                </span>
              </div>

              {/* Product Cards */}
              <div className="px-5 py-5">
                <h2 className="text-sm font-semibold mb-3" style={{ color: theme.secondaryColor }}>
                  Featured Products
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-xl overflow-hidden border"
                      style={{ borderRadius: theme.borderRadius }}>
                      <div className="aspect-square bg-gradient-to-br"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}30, ${theme.accentColor}20)`,
                        }} />
                      <div className="p-2.5">
                        <p className="text-xs font-medium truncate" style={{ color: theme.secondaryColor }}>
                          Gold Ring {i}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold" style={{ color: theme.primaryColor }}>
                            $149
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: theme.accentColor, borderRadius: theme.borderRadius }}>
                            New
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Bar */}
              <div className="px-5 py-3 border-t flex justify-around text-center"
                style={{ backgroundColor: '#00000005' }}>
                {['Shipping', 'Returns', 'Support'].map(label => (
                  <div key={label}>
                    <p className="text-[10px] font-medium" style={{ color: theme.primaryColor }}>{label}</p>
                    <p className="text-[9px]" style={{ color: theme.secondaryColor + '80' }}>Free worldwide</p>
                  </div>
                ))}
              </div>

              {/* Single-page: show more sections */}
              {theme.layoutType === 'single-page' && (
                <>
                  {/* About Section */}
                  <div className="px-5 py-5 border-t">
                    <h2 className="text-sm font-semibold mb-2" style={{ color: theme.secondaryColor }}>
                      About Us
                    </h2>
                    <p className="text-xs" style={{ color: theme.secondaryColor + '99' }}>
                      Crafting timeless jewelry since 2010. Each piece tells a story of elegance and tradition.
                    </p>
                  </div>
                  {/* Contact / CTA */}
                  <div className="px-5 py-5 text-center"
                    style={{ backgroundColor: theme.primaryColor + '15' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: theme.secondaryColor }}>
                      Get in Touch
                    </p>
                    <p className="text-xs mb-3" style={{ color: theme.secondaryColor + '99' }}>
                      Questions? We&apos;d love to hear from you.
                    </p>
                    <span className="inline-block px-4 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>
                      Contact Us
                    </span>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="px-5 py-3 border-t text-center"
                style={{ backgroundColor: theme.secondaryColor }}>
                <p className="text-[10px]" style={{ color: '#ffffff70' }}>
                  &copy; 2025 {store?.name || 'Store Name'}. All rights reserved.
                </p>
              </div>
            </div>

            {/* Layout Info Badge */}
            <div className="mt-3 text-center">
              <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border font-medium ${
                theme.layoutType === 'single-page' ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800' : 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950 dark:border-blue-800'
              }`}>
                {theme.layoutType === 'single-page' ? '📄 Single-Page Landing' : '📑 Multi-Page Site'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}