import { useEffect, useCallback, useRef } from 'react'

type ShortcutMap = {
  onF1?: () => void
  onF2?: () => void
  onF3?: () => void
  onF4?: () => void
  onF6?: () => void
  onF10?: () => void
  onF11?: () => void
  onF12?: () => void
  onEnter?: () => void
  onEscape?: () => void
  onCtrlNumber?: (n: number) => void
}

export function useKeyboardShortcuts(map: ShortcutMap) {
  const mapRef = useRef(map)
  mapRef.current = map

  const handler = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    const m = mapRef.current

    if (e.key === 'Escape') { e.preventDefault(); m.onEscape?.(); return }
    if (e.key === 'F1') { e.preventDefault(); m.onF1?.(); return }
    if (e.key === 'F2') { e.preventDefault(); m.onF2?.(); return }
    if (e.key === 'F3') { e.preventDefault(); m.onF3?.(); return }
    if (e.key === 'F4') { e.preventDefault(); m.onF4?.(); return }
    if (e.key === 'F6') { e.preventDefault(); m.onF6?.(); return }
    if (e.key === 'F10') { e.preventDefault(); m.onF10?.(); return }
    if (e.key === 'F11') { e.preventDefault(); m.onF11?.(); return }
    if (e.key === 'F12') { e.preventDefault(); m.onF12?.(); return }
    if (e.key === 'Enter' && !isInput) { e.preventDefault(); m.onEnter?.(); return }

    if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
      e.preventDefault()
      m.onCtrlNumber?.(parseInt(e.key))
      return
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
