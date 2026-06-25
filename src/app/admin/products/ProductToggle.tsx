'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ProductToggle({ productId, field, value }: { productId: string; field: string; value: boolean }) {
  const [checked, setChecked] = useState(value)
  const router = useRouter()

  async function toggle() {
    const res = await fetch('/api/admin/products/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, field, value: !checked }),
    })
    if (res.ok) { setChecked(!checked); router.refresh() }
  }

  return (
    <button
      onClick={toggle}
      className={`h-5 w-9 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <div className={`h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}
