'use client'

import { useState, useEffect, useCallback } from 'react'
import { HeartPulse, Database, Server, HardDrive, Activity, RefreshCw, Clock, AlertTriangle, CheckCircle2, XCircle, Minus } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'

type HealthCheck = {
  status: string
  latency?: number
  error?: string
  [key: string]: any
}

type HealthData = {
  status: string
  uptime: string
  latency: number
  version: string
  timestamp: string
  checks: Record<string, HealthCheck>
}

export default function AdminSystemHealth() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealth = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/system/health')
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
    } catch {
      if (!silent) setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchHealth() }, [fetchHealth])

  function refresh() {
    setRefreshing(true)
    fetchHealth(true)
  }

  function statusIcon(status: string) {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'unhealthy': return <XCircle className="h-5 w-5 text-red-500" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'not_configured': return <Minus className="h-5 w-5 text-gray-400" />
      default: return <Minus className="h-5 w-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="System Health" subtitle="Monitor system status and performance" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="System Health" subtitle="Monitor system status and performance" />
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <HeartPulse className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load health data</p>
          <button onClick={refresh} className="mt-4 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const summaryCards = [
    { label: 'Status', value: data.status, icon: HeartPulse, color: data.status === 'healthy' ? 'text-green-600 bg-green-50' : data.status === 'degraded' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50' },
    { label: 'Uptime', value: data.uptime, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Response', value: `${data.latency}ms`, icon: Activity, color: 'text-purple-600 bg-purple-50' },
    { label: 'Version', value: data.version, icon: Server, color: 'text-gray-600 bg-gray-50' },
  ]

  return (
    <div>
      <PageHeader
        title="System Health"
        subtitle="Monitor system status and performance"
        actions={
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-navy capitalize">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-navy">Service Checks</h2>
        </div>
        <div className="divide-y divide-border">
          {Object.entries(data.checks).map(([name, check]) => (
            <div key={name} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcon(check.status)}
                <div>
                  <span className="text-sm font-medium text-navy capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                  {check.latency !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">{check.latency}ms</span>
                  )}
                  {check.error && (
                    <p className="text-xs text-red-500 mt-0.5">{check.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {check.total !== undefined && <span>Total: {check.total}</span>}
                {check.errors !== undefined && <span>Errors: {check.errors}</span>}
                {check.rate !== undefined && <span>Rate: {check.rate}</span>}
                {check.pendingOrders !== undefined && <span>Pending: {check.pendingOrders}</span>}
                {check.active !== undefined && <span>Active: {check.active}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-right">
        Last checked: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
