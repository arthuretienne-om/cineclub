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
    <nav
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold mr-4" style={{ color: 'var(--accent)' }}>
            🎬 CineClub
          </span>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                color: path === href ? 'var(--accent)' : 'var(--text-muted)',
                background: path === href ? 'var(--surface-2)' : 'transparent',
              }}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {userName}
          </span>
          <button
            onClick={signOut}
            className="flex items-center gap-1 text-sm px-2 py-1 rounded transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
