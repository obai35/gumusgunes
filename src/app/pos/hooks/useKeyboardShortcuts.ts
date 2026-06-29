import { useEffect } from 'react'

type ShortcutMap = {
  onF1?: () => void
  onF2?: () => void
  onF3?: () => void
  onF4?: () => void
  onF6?: () => void
  onEnter?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(map: ShortcutMap) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.key === 'Escape') { e.preventDefault(); map.onEscape?.(); return }
      if (e.key === 'F1') { e.preventDefault(); map.onF1?.(); return }
      if (e.key === 'F2') { e.preventDefault(); map.onF2?.(); return }
      if (e.key === 'F3') { e.preventDefault(); map.onF3?.(); return }
      if (e.key === 'F4') { e.preventDefault(); map.onF4?.(); return }
      if (e.key === 'F6') { e.preventDefault(); map.onF6?.(); return }
      if (e.key === 'Enter' && !isInput) { e.preventDefault(); map.onEnter?.(); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [map])
}
