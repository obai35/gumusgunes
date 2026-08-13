export const PRIVILEGED_PERMISSIONS = ['security', 'finance'] as const

const SUPER_ROLES = ['superadmin', 'super_admin', 'admin']

export function isPrivilegedAdmin(admin: {
  isSuperAdmin?: boolean
  role?: string
  permissions?: string[]
}): boolean {
  if (admin.isSuperAdmin) return true
  if (admin.role && SUPER_ROLES.includes(admin.role)) return true
  const perms = admin.permissions ?? []
  return PRIVILEGED_PERMISSIONS.some((p) => perms.includes(p))
}

export function enrollmentRequiredFor(admin: {
  totpEnabled?: boolean
  isSuperAdmin?: boolean
  role?: string
  permissions?: string[]
}): boolean {
  return !admin.totpEnabled && isPrivilegedAdmin(admin)
}