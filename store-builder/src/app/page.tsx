'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, StoreIcon, Palette, Download, Eye, Settings, Trash2 } from 'lucide-react'

type Store = {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  isDemo: boolean
  clientName: string | null
  createdAt: string
}

export default function Dashboard() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stores')
      .then(r => r.json())
      .then(data => setStores(data.stores || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Store Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Provision white-label storefronts for your clients</p>
        </div>
        <Link href="/stores/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Store
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border rounded-xl p-5">
          <p className="text-2xl font-bold">{stores.length}</p>
          <p className="text-sm text-muted-foreground">Total Stores</p>
        </div>
        <div className="bg-card border rounded-xl p-5">
          <p className="text-2xl font-bold">{stores.filter(s => s.status === 'active').length}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="bg-card border rounded-xl p-5">
          <p className="text-2xl font-bold">{stores.filter(s => s.isDemo).length}</p>
          <p className="text-sm text-muted-foreground">Demos</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />)}
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <StoreIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No stores yet</h2>
          <p className="text-sm text-muted-foreground mb-4">Create your first white-label store to get started</p>
          <Link href="/stores/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="h-4 w-4" />
            Create Store
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map(store => (
            <div key={store.id} className="bg-card border rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <StoreIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{store.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {store.clientName || 'No client'} · {store.plan} · 
                    <span className={`ml-1 capitalize ${store.status === 'active' ? 'text-green-600' : store.status === 'demo' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {store.status}
                    </span>
                    {store.isDemo && <span className="ml-1 text-amber-600">· Demo</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/stores/${store.id}`} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Configure">
                  <Settings className="h-4 w-4" />
                </Link>
                <Link href={`/stores/${store.id}/theme`} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Theme">
                  <Palette className="h-4 w-4" />
                </Link>
                <Link href={`/stores/${store.id}/generate`} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Generate">
                  <Download className="h-4 w-4" />
                </Link>
                <Link href={`/stores/${store.id}/preview`} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Preview Demo">
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}