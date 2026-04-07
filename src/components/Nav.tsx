'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Film, List, MessageCircle, Star, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/', label: 'Home', icon: Film },
  { href: '/bucket', label: 'Bucket', icon: List },
  { href: '/watched', label: 'Watched', icon: Star },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
]

export default function Nav({ userName }: { userName: string }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50" style={{ background: 'var(--bg-warm)', borderBottom: '1px solid var(--border)' }}>
      {/* Copper strip top */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--copper), transparent)' }} />

      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-5 group">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ border: '1.5px solid var(--copper)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--copper)', fontWeight: 700 }}>CS</span>
            </div>
            <span className="hidden md:block text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.02em' }}>
              Cinephile Starter
            </span>
          </Link>

          {/* Links */}
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all relative"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--copper)' : 'var(--text-muted)',
                }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-px" style={{ background: 'var(--copper)' }} />
                )}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs hidden sm:block px-2 py-1 rounded"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--surface)', fontSize: '0.7rem' }}
          >
            {userName}
          </span>
          <button
            onClick={signOut}
            className="p-1.5 rounded transition-colors hover:bg-[var(--surface)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
