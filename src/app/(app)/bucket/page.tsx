import { createClient } from '@/lib/supabase/server'
import BucketClient from './BucketClient'

export const dynamic = 'force-dynamic'

export default async function BucketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .eq('status', 'bucket')
    .order('created_at', { ascending: false })

  return <BucketClient userId={user!.id} movies={movies ?? []} />
}
