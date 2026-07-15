'use client'

import { useRouter } from 'next/navigation'
import { useShortcut } from './KeyboardShortcutProvider'

export function AdminShortcuts() {
  const router = useRouter()

  useShortcut({ key: '1', ctrl: true, description: 'Go to Dashboard', handler: () => router.push('/admin') })
  useShortcut({ key: '2', ctrl: true, description: 'Go to Orders', handler: () => router.push('/admin/orders') })
  useShortcut({ key: '3', ctrl: true, description: 'Go to Products', handler: () => router.push('/admin/products') })
  useShortcut({ key: '4', ctrl: true, description: 'Go to Inventory', handler: () => router.push('/admin/inventory') })
  useShortcut({ key: 'n', ctrl: true, description: 'New order', handler: () => router.push('/admin/orders') })
  useShortcut({ key: 's', ctrl: true, description: 'Save / Confirm', handler: () => {
    const form = document.querySelector('form')
    if (form) form.requestSubmit()
  }})
  useShortcut({ key: '/', ctrl: true, description: 'Search / Focus search', handler: () => {
    const search = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="earch"]')
    if (search) search.focus()
  }})

  return null
}
