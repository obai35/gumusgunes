'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type PosUser = { id: string; name: string; email: string; branchId: string }
type PosAuthState = {
  token: string | null
  user: PosUser | null
  login: (token: string, user: PosUser) => void
  logout: () => void
}

export const usePosAuth = create<PosAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'gg_pos_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
