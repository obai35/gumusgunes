'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useAdminAuth } from '@/lib/admin-auth-store'

export function AuthHydrator() {
  const fetchUser = useAuth((s) => s.fetchUser)
  const fetchAdminUser = useAdminAuth((s) => s.fetchUser)

  useEffect(() => {
    fetchUser()
    fetchAdminUser()
  }, [fetchUser, fetchAdminUser])

  return null
}
