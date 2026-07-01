export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function onOnlineChange(callback: (online: boolean) => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('online', () => callback(true))
  window.addEventListener('offline', () => callback(false))
  return () => {
    window.removeEventListener('online', () => callback(true))
    window.removeEventListener('offline', () => callback(false))
  }
}
