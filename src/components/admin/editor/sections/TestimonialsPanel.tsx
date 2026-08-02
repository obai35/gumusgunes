'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus, Star } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

interface Testimonial {
  id: string
  name: string
  role: string
  photo: string
  quote: string
  rating: number
  active: boolean
}

export function TestimonialsPanel() {
  const { settings, updateSetting } = useEditor()
  const { ta } = useAdminTranslate()
  let raw: Testimonial[] = []
  try { if (settings.testimonials) raw = JSON.parse(settings.testimonials) } catch {}
  const [testimonials, setTestimonials] = useState<Testimonial[]>(raw)

  const persist = (next: Testimonial[]) => {
    setTestimonials(next)
    updateSetting('testimonials', JSON.stringify(next))
  }

  const update = (id: string, field: keyof Testimonial, value: string | number | boolean) => {
    persist(testimonials.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const add = () => {
    const id = String(Date.now())
    persist([...testimonials, { id, name: '', role: '', photo: '', quote: '', rating: 5, active: true }])
  }

  const remove = (id: string) => {
    persist(testimonials.filter(t => t.id !== id))
  }

  const toggle = (id: string) => {
    persist(testimonials.map(t => t.id === id ? { ...t, active: !t.active } : t))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{ta('Customer testimonials displayed on the homepage.')}</p>
      {testimonials.map((t) => (
        <div key={t.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.name || ta('New Testimonial')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggle(t.id)}
                className={`text-xs px-2 py-0.5 rounded ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {t.active ? ta('Active') : ta('Hidden')}
              </button>
              <button onClick={() => remove(t.id)} className="text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">{ta('Name')}</label>
              <Input value={t.name} onChange={e => update(t.id, 'name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">{ta('Role')}</label>
              <Input value={t.role} onChange={e => update(t.id, 'role', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">{ta('Photo URL')}</label>
            <Input value={t.photo} onChange={e => update(t.id, 'photo', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">{ta('Quote')}</label>
            <Textarea rows={3} value={t.quote} onChange={e => update(t.id, 'quote', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">{ta('Rating')}</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => update(t.id, 'rating', n)}>
                  <Star className={`w-5 h-5 ${n <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button onClick={add} variant="outline" size="sm" className="w-full">
        <Plus className="w-4 h-4 mr-1" /> {ta('Add Testimonial')}
      </Button>
    </div>
  )
}
