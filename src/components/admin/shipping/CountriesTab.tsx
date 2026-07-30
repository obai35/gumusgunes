'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Globe, MapPin } from 'lucide-react'

type Governorate = { id: string; name: string; nameAr: string; countryId: string }
type Country = { id: string; name: string; nameAr: string; isoCode: string; isActive: boolean; governorates: Governorate[] }

export default function CountriesTab() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [showCountryForm, setShowCountryForm] = useState(false)
  const [countryName, setCountryName] = useState('')
  const [countryNameAr, setCountryNameAr] = useState('')
  const [countryIso, setCountryIso] = useState('')
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)

  const [showGovForm, setShowGovForm] = useState(false)
  const [govName, setGovName] = useState('')
  const [govNameAr, setGovNameAr] = useState('')
  const [govCountryId, setGovCountryId] = useState('')
  const [editingGov, setEditingGov] = useState<Governorate | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const res = await fetch('/api/admin/shipping/countries')
    if (res.ok) { const d = await res.json(); setCountries(Array.isArray(d.countries) ? d.countries : []) }
    setLoading(false)
  }

  function resetCountryForm() { setCountryName(''); setCountryNameAr(''); setCountryIso(''); setEditingCountry(null); setShowCountryForm(false) }
  function resetGovForm() { setGovName(''); setGovNameAr(''); setGovCountryId(''); setEditingGov(null); setShowGovForm(false) }

  async function handleSaveCountry() {
    if (!countryName.trim()) return
    if (editingCountry) {
      await fetch(`/api/admin/shipping/countries/${editingCountry.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: countryName, nameAr: countryNameAr || countryName, isoCode: countryIso }),
      })
      toast.success('Country updated')
    } else {
      await fetch('/api/admin/shipping/countries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: countryName, nameAr: countryNameAr || countryName, isoCode: countryIso }),
      })
      toast.success('Country created')
    }
    resetCountryForm()
    fetchData()
  }

  async function handleDeleteCountry(id: string) {
    await fetch(`/api/admin/shipping/countries/${id}`, { method: 'DELETE' })
    toast.success('Country deleted')
    fetchData()
  }

  async function handleSaveGov() {
    if (!govName.trim() || !govCountryId) return
    if (editingGov) {
      await fetch(`/api/admin/shipping/governorates/${editingGov.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: govName, nameAr: govNameAr || govName, countryId: govCountryId }),
      })
      toast.success('Governorate updated')
    } else {
      await fetch('/api/admin/shipping/governorates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: govName, nameAr: govNameAr || govName, countryId: govCountryId }),
      })
      toast.success('Governorate created')
    }
    resetGovForm()
    fetchData()
  }

  async function handleDeleteGov(id: string) {
    await fetch(`/api/admin/shipping/governorates/${id}`, { method: 'DELETE' })
    toast.success('Governorate deleted')
    fetchData()
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      {/* Country Form */}
      {showCountryForm && (
        <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
          <h3 className="font-semibold text-sm text-navy">{editingCountry ? 'Edit Country' : 'Add Country'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <input value={countryName} onChange={e => setCountryName(e.target.value)} placeholder="Country name (en)" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={countryNameAr} onChange={e => setCountryNameAr(e.target.value)} placeholder="Country name (ar)" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={countryIso} onChange={e => setCountryIso(e.target.value)} placeholder="ISO code (e.g. EG)" className="px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveCountry} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">{editingCountry ? 'Update' : 'Create'}</button>
            <button onClick={resetCountryForm} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Governorate Form */}
      {showGovForm && (
        <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
          <h3 className="font-semibold text-sm text-navy">{editingGov ? 'Edit Governorate' : 'Add Governorate'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <input value={govName} onChange={e => setGovName(e.target.value)} placeholder="Governorate name (en)" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={govNameAr} onChange={e => setGovNameAr(e.target.value)} placeholder="Governorate name (ar)" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <select value={govCountryId} onChange={e => setGovCountryId(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white">
              <option value="">Select country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveGov} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">{editingGov ? 'Update' : 'Create'}</button>
            <button onClick={resetGovForm} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{countries.length} countries</p>
        <div className="flex gap-2">
          <button onClick={() => { resetGovForm(); setShowGovForm(!showGovForm) }} className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-gray-50">
            <MapPin className="h-3.5 w-3.5" /> {showGovForm ? 'Cancel' : 'Add Governorate'}
          </button>
          <button onClick={() => { resetCountryForm(); setShowCountryForm(!showCountryForm) }} className="flex items-center gap-1 px-3 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-3.5 w-3.5" /> {showCountryForm ? 'Cancel' : 'Add Country'}
          </button>
        </div>
      </div>

      {/* Country List */}
      <div className="space-y-2">
        {countries.map(country => (
          <div key={country.id} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50" onClick={() => toggleExpand(country.id)}>
              <div className="flex items-center gap-3">
                {expanded.has(country.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <Globe className="h-4 w-4 text-navy" />
                <span className="font-medium text-navy">{country.name}</span>
                <span className="text-xs text-muted-foreground">({country.nameAr})</span>
                {country.isoCode && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-muted-foreground">{country.isoCode}</span>}
                <span className="text-xs text-muted-foreground">{country.governorates.length} governorates</span>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditingCountry(country); setCountryName(country.name); setCountryNameAr(country.nameAr); setCountryIso(country.isoCode); setShowCountryForm(true) }} className="text-xs text-gold hover:underline flex items-center gap-1">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button onClick={() => handleDeleteCountry(country.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
            {expanded.has(country.id) && (
              <div className="border-t border-border">
                {country.governorates.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">No governorates added yet.</p>}
                {country.governorates.map(gov => (
                  <div key={gov.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-gray-50/30">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{gov.name}</span>
                      <span className="text-xs text-muted-foreground">({gov.nameAr})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingGov(gov); setGovName(gov.name); setGovNameAr(gov.nameAr); setGovCountryId(gov.countryId); setShowGovForm(true) }} className="text-xs text-gold hover:underline">Edit</button>
                      <button onClick={() => handleDeleteGov(gov.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {countries.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No countries added yet. Click &quot;Add Country&quot; to get started.</p>}
      </div>
    </div>
  )
}
