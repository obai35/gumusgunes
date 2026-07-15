import { AdminShell } from '@/components/admin/AdminShell'
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminErrorBoundary>
      <AdminShell>{children}</AdminShell>
    </AdminErrorBoundary>
  )
}
