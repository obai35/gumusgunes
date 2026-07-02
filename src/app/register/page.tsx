'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-store'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (res.ok) {
      const data = await res.json()
      login(data.user)
      toast.success('Account created!')
      router.push('/')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-gold/30">
              <img src="/gumusgunes-logo.jpeg" alt="Gümüş Güneş" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-2xl font-semibold text-navy">Gümüş <span className="gold-text">Güneş</span></span>
          </Link>
          <h1 className="text-2xl font-display font-semibold text-navy">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join Silver Sun today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-medium text-navy">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder="At least 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:text-gold/80 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
