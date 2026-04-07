import { createClient } from '@/lib/supabase/server'
import WatchedClient from './WatchedClient'

export const dynamic = 'force-dynamic'

export default async function WatchedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: movies }, { data: reviews }] = await Promise.all([
    supabase.from('movies').select('*').eq('status', 'watched').order('watched_at', { ascending: false }),
    supabase.from('reviews').select('*'),
  ])

  return <WatchedClient userId={user!.id} movies={movies ?? []} reviews={reviews ?? []} />
}
