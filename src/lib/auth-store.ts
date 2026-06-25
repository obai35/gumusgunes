'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type User = { id: string; email: string; name: string }
type AuthState = {
  token: string | null
  user: User | null
  totpPending: { userId: string; email: string } | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  setTotpPending: (data: { userId: string; email: string } | null) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      totpPending: null,
      login: (token, user) => set({ token, user, totpPending: null }),
      logout: () => set({ token: null, user: null, totpPending: null }),
      isAuthenticated: () => !!get().token,
      setTotpPending: (data) => set({ totpPending: data }),
    }),
    {
      name: 'gg_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
