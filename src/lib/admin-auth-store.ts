'use client'

import { create } from 'zustand'

type AdminUser = { id: string; email: string; name: string; role?: string; permissions?: string[] }
type AdminAuthState = {
  user: AdminUser | null
  loading: boolean
  totpPending: { adminId: string; email: string } | null
  adminLogin: (user: AdminUser) => void
  logout: () => void
  setTotpPending: (data: { adminId: string; email: string } | null) => void
  fetchUser: () => Promise<void>
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
  user: null,
  loading: true,
  totpPending: null,
  adminLogin: (user) => set({ user, totpPending: null }),
  logout: () => set({ user: null, totpPending: null }),
  setTotpPending: (data) => set({ totpPending: data }),
  fetchUser: async () => {
    try {
      const res = await fetch('/api/admin/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({ user: data.admin, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },
}))
