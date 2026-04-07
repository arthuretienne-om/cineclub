import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: selected }, { data: settings }, { data: bucket }, { data: members }] = await Promise.all([
    supabase.from('movies').select('*').eq('status', 'selected').order('selected_at', { ascending: false }).limit(1),
    supabase.from('settings').select('*').single(),
    supabase.from('movies').select('id').eq('status', 'bucket'),
    supabase.from('profiles').select('id, name, email'),
  ])

  return (
    <HomeClient
      userId={user!.id}
      currentMovie={selected?.[0] ?? null}
      settings={settings}
      bucketCount={bucket?.length ?? 0}
      members={members ?? []}
    />
  )
}
