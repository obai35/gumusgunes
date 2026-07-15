'use client'

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import type { ReactNode } from 'react'

type StatsCardProps = {
  icon: LucideIcon
  label: string
  value: string
  sub?: ReactNode
  trend?: { value: number; positive: boolean }
  onClick?: () => void
}

export function StatsCard({ icon: Icon, label, value, sub, trend, onClick }: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl border-border p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="h-12 w-12 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6 text-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {trend && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  )
}
