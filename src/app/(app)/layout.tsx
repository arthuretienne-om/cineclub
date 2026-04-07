import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      {/* Subtle horizontal scan lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #c2703e 2px, #c2703e 3px)',
        backgroundSize: '100% 3px',
      }} />
      <Nav userName={profile?.name ?? user.email ?? 'You'} />
      <main className="max-w-4xl mx-auto px-4 py-8 relative">{children}</main>
    </div>
  )
}
