import { type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function StatsCard({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-lg bg-gold/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-gold" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-navy">{value}</p>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}
