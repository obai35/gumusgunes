'use client'

import { useEffect } from 'react'

const CSS_VAR_MAP: Record<string, string> = {
  primaryColor: '--color-navy',
  accentColor: '--color-gold',
  bgColor: '--color-background',
  textColor: '--color-foreground',
  primaryFont: '--font-sans',
  headingFont: '--font-display',
}

const SECTION_MAP: Record<string, string> = {
  announcement: 'announcement',
  hero: 'hero',
  'trust-badges': 'trustBadges',
  'flash-sale': 'promo',
  footer: 'footer',
  'category-grid': 'categories',
  'featured-products': 'layout',
  'promo-banner': 'promo',
  'new-arrivals': 'layout',
  bestsellers: 'layout',
  'about-section': 'aboutSection',
  'product-grid': 'layout',
}

export function PreviewListener() {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'settings-update') {
        const { key, value } = event.data
        const cssVar = CSS_VAR_MAP[key as string]
        if (cssVar) {
          document.documentElement.style.setProperty(cssVar, value as string)
        }
        const el = document.querySelector<HTMLElement>(`[data-setting="${key}"]`)
        if (el) {
          el.textContent = value as string
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      [data-editable] { outline: 2px solid transparent; transition: outline-color 0.15s; cursor: pointer; position: relative; }
      [data-editable]:hover { outline-color: #c9a84c; }
      [data-editable]::after {
        content: attr(data-editable-label);
        position: absolute; top: 4px; right: 4px;
        background: #c9a84c; color: #0a1628;
        font-size: 10px; font-family: sans-serif;
        padding: 1px 6px; border-radius: 3px;
        opacity: 0; transition: opacity 0.15s;
        pointer-events: none; z-index: 9999;
      }
      [data-editable]:hover::after { opacity: 1; }
      [data-setting]:focus { outline: 2px solid #c9a84c; outline-offset: 2px; border-radius: 2px; }
    `
    document.head.appendChild(style)

    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      const settingEl = target.closest<HTMLElement>('[data-setting]')
      if (settingEl && !settingEl.isContentEditable) {
        const key = settingEl.dataset.setting
        if (key) {
          e.stopPropagation()
          settingEl.contentEditable = 'true'
          settingEl.focus()
          const range = document.createRange()
          range.selectNodeContents(settingEl)
          const sel = window.getSelection()
          if (sel) { sel.removeAllRanges(); sel.addRange(range) }
          const blurHandler = () => {
            settingEl.contentEditable = 'false'
            const value = settingEl.textContent?.trim() || ''
            window.parent.postMessage({ type: 'inline-update', key, value }, '*')
            settingEl.removeEventListener('blur', blurHandler)
          }
          settingEl.addEventListener('blur', blurHandler)
          settingEl.addEventListener('keydown', (ke: KeyboardEvent) => {
            if (ke.key === 'Enter' && !ke.shiftKey) {
              ke.preventDefault()
              settingEl.blur()
            }
            if (ke.key === 'Escape') {
              settingEl.contentEditable = 'false'
              settingEl.removeEventListener('blur', blurHandler)
            }
          })
          return
        }
      }

      const sectionEl = target.closest<HTMLElement>('[data-editable]')
      if (sectionEl) {
        const name = sectionEl.dataset.editable
        if (name) {
          window.parent.postMessage({ type: 'section-clicked', section: SECTION_MAP[name] || name }, '*')
        }
      }
    }

    document.addEventListener('click', clickHandler)
    return () => {
      document.removeEventListener('click', clickHandler)
      document.head.removeChild(style)
    }
  }, [])

  return null
}
