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
  accentColor?: string
}

export function StatsCard({ icon: Icon, label, value, sub, trend, onClick, accentColor = 'gold' }: StatsCardProps) {
  const accentMap: Record<string, string> = {
    gold: 'bg-gold',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  }
  const iconBgMap: Record<string, string> = {
    gold: 'bg-gold/10 text-gold',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div
      onClick={onClick}
      className={`relative bg-card rounded-xl border-border overflow-hidden ${onClick ? 'cursor-pointer group' : ''}`}
    >
      <div className={`h-1 w-full ${accentMap[accentColor] || accentMap.gold}`} />
      <div className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-lg ${iconBgMap[accentColor] || iconBgMap.gold} flex items-center justify-center shrink-0 transition-transform ${onClick ? 'group-hover:scale-110' : ''}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
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
    </div>
  )
}
