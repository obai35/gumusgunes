'use client'

import { Clock, Plus, UserCheck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const ACTION_ICONS: Record<string, string> = {
  create: 'green', update: 'blue', delete: 'red', login: 'purple', logout: 'gray',
}

function ActivityIcon({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    gray: 'text-gray-600 bg-gray-100',
  }
  const color = colorMap[ACTION_ICONS[action] || 'gray']
  const iconMap: Record<string, any> = {
    create: Plus, update: UserCheck, delete: AlertTriangle, login: Clock, logout: Clock,
  }
  const Icon = iconMap[action] || Clock
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
  )
}

type ActivityItem = {
  id: string
  action: string
  adminName?: string
  resource: string
  createdAt: string
}

type ActivityFeedProps = {
  activities: ActivityItem[]
  loading?: boolean
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-navy flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </h2>
        <Link
          href="/admin/admins?tab=activity"
          className="text-xs text-gold hover:text-gold/80 font-medium flex items-center gap-1"
        >
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
      ) : (
        <div className="space-y-1">
          {activities.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
              <ActivityIcon action={log.action} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy">
                  <span className="font-medium">{log.adminName || 'System'}</span>
                  {' '}
                  <span className="text-muted-foreground capitalize">{log.action}d</span>
                  {' '}
                  <span className="font-medium">{log.resource}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
