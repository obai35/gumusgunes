'use client'

import { useEffect, useState } from 'react'
import { Edit3 } from 'lucide-react'

export default function EditModeOverlay() {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch('/api/admin/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setAuthed(!!data.admin))
      .catch(() => setAuthed(false))
  }, [])

  if (!authed) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-1 text-xs">
        <a href="/admin/login" className="underline">Login as admin</a> to use edit mode.
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-gold text-navy-deep text-center py-1 text-xs font-medium flex items-center justify-center gap-2">
        <Edit3 className="h-3 w-3" />
        Edit Mode — Click any section to edit
        <a href="/admin/editor" className="ml-2 underline">Open in Editor →</a>
      </div>
      <style>{`
        [data-editable] { position: relative; }
        [data-editable]:hover { outline: 2px dashed #c9a84c; outline-offset: -2px; cursor: pointer; }
      `}</style>
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href={typeof window !== 'undefined' ? window.location.pathname : '/'}
          className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs shadow-lg hover:bg-navy/90"
        >
          Exit Edit Mode
        </a>
      </div>
    </>
  )
}
