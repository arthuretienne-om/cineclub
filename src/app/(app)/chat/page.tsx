import { createClient } from '@/lib/supabase/server'
import ChatClient from './ChatClient'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(100)

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user!.id)
    .single()

  return (
    <ChatClient
      userId={user!.id}
      userName={profile?.name ?? 'You'}
      initialMessages={messages ?? []}
    />
  )
}
