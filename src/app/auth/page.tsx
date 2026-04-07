'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) { setError(error.message); setLoading(false); return }
      await supabase.auth.signInWithPassword({ email, password })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: 'var(--bg)' }}>
      {/* Background texture lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div style={{
          width: '100%', height: '100%',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, var(--cream) 30px, var(--cream) 31px)',
        }} />
      </div>

      <div className="w-full max-w-sm relative curtain-in">
        {/* Logo area */}
        <div className="text-center mb-10">
          {/* Film reel icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 relative"
            style={{ border: '2px solid var(--copper)', background: 'var(--surface)' }}>
            <div className="w-6 h-6 rounded-full" style={{ border: '2px solid var(--copper)' }} />
            <div className="absolute w-2 h-2 rounded-full top-1.5" style={{ background: 'var(--copper)' }} />
            <div className="absolute w-2 h-2 rounded-full bottom-1.5" style={{ background: 'var(--copper)' }} />
            <div className="absolute w-2 h-2 rounded-full left-1.5" style={{ background: 'var(--copper)' }} />
            <div className="absolute w-2 h-2 rounded-full right-1.5" style={{ background: 'var(--copper)' }} />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--cream)', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Cinephile Starter
          </h1>
          <p className="mt-1.5" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Draw &middot; Watch &middot; Rate
          </p>
        </div>

        {/* Ticket-style card */}
        <div className="ticket rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className="flex-1 py-3 text-sm transition-all relative"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: mode === m ? 600 : 400,
                  color: mode === m ? 'var(--copper)' : 'var(--text-muted)',
                  background: mode === m ? 'var(--surface)' : 'var(--surface-2)',
                  letterSpacing: '0.05em',
                }}
              >
                {m === 'login' ? 'Enter' : 'Join'}
                {mode === m && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5" style={{ background: 'var(--copper)' }} />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'signup' && (
              <div className="curtain-in">
                <label className="block mb-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Arthur"
                  required
                  className="w-full px-3.5 py-2.5 rounded text-sm outline-none transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
            )}

            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded text-sm outline-none transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 rounded text-sm outline-none transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded" style={{ background: '#3d1515', color: '#e88080', fontFamily: 'var(--font-body)', border: '1px solid #5a2020' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded text-sm font-semibold mt-2 transition-all disabled:opacity-50"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'var(--copper)',
                color: 'var(--cream)',
                letterSpacing: '0.06em',
                fontSize: '0.85rem',
              }}
            >
              {loading ? 'Un moment...' : mode === 'login' ? 'Enter the booth' : 'Get your ticket'}
            </button>
          </form>

          {/* Perforation at bottom */}
          <div className="perforation mx-3 mb-3 pt-3">
            <p className="text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              ADMIT TWO &middot; CINEPHILE STARTER &middot; 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
