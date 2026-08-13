'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AdminUser = { id: string; email: string; name: string; role?: string; permissions?: string[]; storeId?: string; storeName?: string }
type AdminAuthState = {
  user: AdminUser | null
  loading: boolean
  initialized: boolean
  totpPending: { email: string } | null
  adminLogin: (user: AdminUser) => void
  logout: () => void
  setTotpPending: (data: { email: string } | null) => void
  fetchUser: () => Promise<void>
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      initialized: false,
      totpPending: null,
      adminLogin: (user) => set({ user, loading: false, initialized: true, totpPending: null }),
      logout: () => set({ user: null, totpPending: null }),
      setTotpPending: (data) => set({ totpPending: data }),
      fetchUser: async () => {
        try {
          const res = await fetch('/api/admin/auth/me')
          if (res.ok) {
            const data = await res.json()
            set({ user: data.admin, loading: false, initialized: true })
          } else {
            set((s) => {
              if (s.initialized) return { loading: false }
              return { user: null, loading: false, initialized: true }
            })
          }
        } catch {
          set((s) => {
            if (s.initialized) return { loading: false }
            return { user: null, loading: false, initialized: true }
          })
        }
      },
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
