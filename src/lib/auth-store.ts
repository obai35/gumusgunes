'use client'

import { create } from 'zustand'

type User = { id: string; email: string; name: string }
type AuthState = {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  fetchUser: () => Promise<void>
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  loading: true,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  isAuthenticated: () => !!get().user,
  fetchUser: async () => {
    try {
      const res = await fetch('/api/customer/auth/me')
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
