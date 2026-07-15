'use client'

import { useState } from 'react'
import { Database, RefreshCw, Globe, Trash2, CheckCircle2, XCircle, Server, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'

type CacheAction = 'clear-redis' | 'delete-redis-key' | 'clear-isr' | 'clear-cdn'

export default function AdminCache() {
  const [loading, setLoading] = useState<CacheAction | null>(null)
  const [results, setResults] = useState<Record<string, any> | null>(null)
  const [redisKey, setRedisKey] = useState('')

  async function executeAction(action: CacheAction) {
    if (action === 'delete-redis-key' && !redisKey) {
      toast.error('Enter a Redis key to delete')
      return
    }
    if (!confirm(`Are you sure you want to ${action.replace(/-/g, ' ')}?`)) return
    setLoading(action)
    setResults(null)
    try {
      const body: any = { action }
      if (action === 'delete-redis-key') body.key = redisKey
      const res = await fetch('/api/admin/system/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setResults(data.results || data)
      const allSuccess = Object.values(data.results || {}).every((r: any) => r.success)
      if (allSuccess) {
        toast.success(`${action.replace(/-/g, ' ')} completed successfully`)
      } else {
        toast.warning('Some cache operations had errors')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear cache')
    } finally {
      setLoading(null)
    }
  }

  const actions = [
    {
      id: 'clear-redis' as CacheAction,
      title: 'Clear Redis Cache',
      description: 'Flush all Redis keys. This will clear cached data, sessions, and temporary data.',
      icon: Database,
      color: 'text-orange-600 bg-orange-50',
      requiresKey: false,
    },
    {
      id: 'delete-redis-key' as CacheAction,
      title: 'Delete Redis Key',
      description: 'Delete a specific Redis key by name.',
      icon: Trash2,
      color: 'text-yellow-600 bg-yellow-50',
      requiresKey: true,
    },
    {
      id: 'clear-isr' as CacheAction,
      title: 'Clear ISR Cache',
      description: 'Revalidate all Next.js Incremental Static Regeneration (ISR) cache. Pages will be regenerated on next request.',
      icon: RefreshCw,
      color: 'text-blue-600 bg-blue-50',
      requiresKey: false,
    },
    {
      id: 'clear-cdn' as CacheAction,
      title: 'Purge CDN Cache',
      description: 'Send a purge request to the CDN to clear cached static assets.',
      icon: Globe,
      color: 'text-purple-600 bg-purple-50',
      requiresKey: false,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Cache Management"
        subtitle="Clear and manage system caches"
      />

      <div className="grid gap-4">
        {actions.map(action => (
          <div key={action.id} className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">{action.description}</p>
                  {action.requiresKey && (
                    <input
                      type="text"
                      value={redisKey}
                      onChange={e => setRedisKey(e.target.value)}
                      placeholder="e.g. product:123"
                      className="mt-3 px-3 py-2 rounded-lg border border-border text-sm font-mono w-full max-w-sm"
                    />
                  )}
                </div>
              </div>
              <button
                onClick={() => executeAction(action.id)}
                disabled={loading === action.id}
                className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {loading === action.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {loading === action.id ? 'Clearing...' : 'Clear'}
              </button>
            </div>

            {results && (() => {
              const key = action.id === 'delete-redis-key' ? 'redis' : action.id === 'clear-redis' ? 'redis' : action.id === 'clear-isr' ? 'isr' : 'cdn'
              const result = results[key]
              if (!result) return null
              return (
                <div className={`mt-4 flex items-start gap-2 text-sm p-3 rounded-lg ${
                  result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {result.success ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div>
                    {result.success ? 'Operation completed successfully' : result.error || 'Operation failed'}
                    {result.key && <span className="block font-mono text-xs mt-1">Key: {result.key}</span>}
                    {result.status && <span className="block text-xs mt-1">HTTP {result.status}</span>}
                  </div>
                </div>
              )
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}
