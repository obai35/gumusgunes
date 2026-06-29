'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type AdminUser = { id: string; email: string; name: string }
type AdminAuthState = {
  token: string | null
  user: AdminUser | null
  totpPending: { adminId: string; email: string } | null
  login: (token: string, user: AdminUser) => void
  logout: () => void
  setTotpPending: (data: { adminId: string; email: string } | null) => void
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      totpPending: null,
      login: (token, user) => set({ token, user, totpPending: null }),
      logout: () => set({ token: null, user: null, totpPending: null }),
      setTotpPending: (data) => set({ totpPending: data }),
    }),
    {
      name: 'gg_admin_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
