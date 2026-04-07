'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/types'
import { Send } from 'lucide-react'
import { format } from 'date-fns'

export default function ChatClient({
  userId,
  userName,
  initialMessages,
}: {
  userId: string
  userName: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)

    await supabase.from('messages').insert({
      user_id: userId,
      user_name: userName,
      content: text.trim(),
    })

    setText('')
    setSending(false)
  }

  function groupMessages() {
    const groups: { date: string; msgs: Message[] }[] = []
    let currentDate = ''

    for (const msg of messages) {
      const date = format(new Date(msg.created_at), 'EEEE, MMMM d')
      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, msgs: [] })
      }
      groups[groups.length - 1].msgs.push(msg)
    }

    return groups
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Chat</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Talk about movies with your sis</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No messages yet. Say hi!
          </div>
        )}

        {groupMessages().map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>{date}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <div className="space-y-1">
              {msgs.map((msg, i) => {
                const isMe = msg.user_id === userId
                const showName = i === 0 || msgs[i - 1].user_id !== msg.user_id

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} msg-in`}>
                    <div className={`max-w-xs sm:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showName && !isMe && (
                        <span className="text-xs mb-1 ml-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                          {msg.user_name}
                        </span>
                      )}
                      <div
                        className="px-3 py-2 rounded-2xl text-sm"
                        style={{
                          background: isMe ? 'var(--accent)' : 'var(--surface)',
                          color: isMe ? '#0d0d0f' : 'var(--text)',
                          border: isMe ? 'none' : '1px solid var(--border)',
                          borderBottomRightRadius: isMe ? 4 : undefined,
                          borderBottomLeftRadius: isMe ? undefined : 4,
                        }}
                      >
                        {msg.content}
                      </div>
                      <span className="text-xs mt-0.5 mx-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#0d0d0f' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
