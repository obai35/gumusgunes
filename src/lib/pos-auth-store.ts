'use client'

import { create } from 'zustand'
import { wipeLegacyPosToken } from './pos-client-fetch'

type PosUser = { id: string; name: string; email: string; branchId: string }
type PosAuthState = {
  user: PosUser | null
  loading: boolean
  login: (user: PosUser) => void
  logout: () => void
  fetchUser: () => Promise<void>
}

export const usePosAuth = create<PosAuthState>()((set) => ({
  user: null,
  loading: true,
  login: (user) => set({ user, loading: false }),
  logout: () => set({ user: null }),
  fetchUser: async () => {
    wipeLegacyPosToken()
    try {
      const res = await fetch('/api/pos/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },
}))