'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPosterUrl } from '@/lib/tmdb'
import { Movie, Settings, Frequency, Profile } from '@/lib/types'
import { Shuffle, Calendar, Film, Settings as SettingsIcon, Copy, Check, Users, Link as LinkIcon } from 'lucide-react'
import { addWeeks, addMonths, format } from 'date-fns'
import Image from 'next/image'

const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
}

function getNextDate(frequency: Frequency) {
  const now = new Date()
  if (frequency === 'weekly') return addWeeks(now, 1)
  if (frequency === 'biweekly') return addWeeks(now, 2)
  return addMonths(now, 1)
}

export default function HomeClient({
  userId,
  currentMovie,
  settings,
  bucketCount,
  members,
}: {
  userId: string
  currentMovie: Movie | null
  settings: Settings | null
  bucketCount: number
  members: Pick<Profile, 'id' | 'name' | 'email'>[]
}) {
  const [movie, setMovie] = useState<Movie | null>(currentMovie)
  const [freq, setFreq] = useState<Frequency>(settings?.frequency ?? 'biweekly')
  const [nextDate, setNextDate] = useState<string | null>(settings?.next_draw_date ?? null)
  const [drawing, setDrawing] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function copyInviteLink() {
    await navigator.clipboard.writeText(window.location.origin + '/auth')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function drawMovie() {
    setDrawing(true)
    setSpinning(true)

    const { data: bucket } = await supabase.from('movies').select('*').eq('status', 'bucket')

    if (!bucket || bucket.length === 0) {
      setDrawing(false)
      setSpinning(false)
      alert('No movies in the bucket! Add some first.')
      return
    }

    if (movie) {
      await supabase.from('movies').update({ status: 'bucket', selected_at: null }).eq('id', movie.id)
    }

    const picked = bucket[Math.floor(Math.random() * bucket.length)] as Movie
    await supabase.from('movies').update({ status: 'selected', selected_at: new Date().toISOString() }).eq('id', picked.id)

    const next = getNextDate(freq)
    await supabase.from('settings').update({ next_draw_date: next.toISOString() }).eq('id', 1)
    setNextDate(next.toISOString())

    setTimeout(() => {
      setSpinning(false)
      setMovie(picked)
      setDrawing(false)
      router.refresh()
    }, 1500)
  }

  async function markWatched() {
    if (!movie) return
    await supabase.from('movies').update({ status: 'watched', watched_at: new Date().toISOString() }).eq('id', movie.id)
    setMovie(null)
    router.push('/watched')
    router.refresh()
  }

  async function saveFrequency(f: Frequency) {
    setFreq(f)
    await supabase.from('settings').update({ frequency: f }).eq('id', 1)
    setShowSettings(false)
  }

  const posterUrl = movie?.poster_path ? getPosterUrl(movie.poster_path) : null
  const otherMembers = members.filter(m => m.id !== userId)
  const needsInvite = otherMembers.length === 0

  return (
    <div className="space-y-6 curtain-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="marquee">Now Playing</span>
          <h1 className="mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--cream)', fontWeight: 700 }}>
            Dashboard
          </h1>
          <p className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            {FREQUENCY_LABELS[freq]} &middot; {bucketCount} in bucket
          </p>
        </div>
        <button
          onClick={() => setShowSettings(v => !v)}
          className="p-2.5 rounded transition-colors"
          style={{ color: 'var(--text-muted)', background: showSettings ? 'var(--surface-2)' : 'transparent', border: '1px solid var(--border)' }}
        >
          <SettingsIcon size={16} />
        </button>
      </div>

      {/* Invite banner */}
      {needsInvite && (
        <div className="ticket rounded-lg overflow-hidden pop-in">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: '1.5px solid var(--copper)', background: 'var(--surface-2)' }}>
                <Users size={18} style={{ color: 'var(--copper)' }} />
              </div>
              <div className="flex-1">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream)', fontWeight: 600 }}>
                  Send a ticket to your sister
                </h3>
                <p className="mt-1.5" style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Share this link — she signs up and you both share the same bucket list, chat, and ratings.
                </p>
                <button
                  onClick={copyInviteLink}
                  className="flex items-center gap-2 mt-3 px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-85"
                  style={{ background: 'var(--copper)', color: 'var(--cream)', fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy invite link'}
                </button>
              </div>
            </div>
          </div>
          <div className="perforation mx-4 pb-3 pt-3">
            <p className="text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              ADMIT TWO &middot; VALID FOREVER
            </p>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="flex items-center justify-between py-3 px-4 rounded" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Crew
          </span>
          <div className="flex gap-1.5">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--copper-dim)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--cream)', fontWeight: 700 }}>
                  {m.name[0]?.toUpperCase()}
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {m.name}{m.id === userId ? '' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
        {!needsInvite && (
          <button onClick={copyInviteLink} className="flex items-center gap-1 transition-opacity hover:opacity-70" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--copper)', letterSpacing: '0.04em' }}>
            {copied ? <Check size={10} /> : <LinkIcon size={10} />}
            {copied ? 'Copied' : 'Invite'}
          </button>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="ticket rounded-lg p-5 pop-in">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Watch Frequency</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map(f => (
              <button
                key={f}
                onClick={() => saveFrequency(f)}
                className="px-4 py-2 rounded text-sm transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: freq === f ? 600 : 400,
                  background: freq === f ? 'var(--copper)' : 'var(--surface-2)',
                  color: freq === f ? 'var(--cream)' : 'var(--text-dim)',
                  border: `1px solid ${freq === f ? 'var(--copper)' : 'var(--border)'}`,
                }}
              >
                {FREQUENCY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current movie */}
      <div className="sprocket rounded-lg overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {movie ? (
          <div>
            <div className="marquee w-full text-center">Now Showing</div>
            <div className="flex gap-0">
              <div className="relative w-40 flex-shrink-0">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    width={160}
                    height={240}
                    className={`w-full h-full object-cover ${spinning ? 'draw-spin' : ''}`}
                    style={{ minHeight: 240 }}
                  />
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ height: 240, background: 'var(--surface-2)' }}>
                    <Film size={40} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
              </div>

              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', fontWeight: 700, lineHeight: 1.2 }}>
                    {movie.title}
                  </h2>
                  <p className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                    {movie.release_date?.slice(0, 4)} &middot; Added by {movie.added_by_name}
                  </p>
                  {movie.overview && (
                    <p className="mt-3 line-clamp-3" style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                      {movie.overview}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-5 flex-wrap">
                  <button
                    onClick={markWatched}
                    className="px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-85"
                    style={{ fontFamily: 'var(--font-display)', background: 'var(--copper)', color: 'var(--cream)', letterSpacing: '0.03em' }}
                  >
                    Mark as watched
                  </button>
                  <button
                    onClick={drawMovie}
                    disabled={drawing}
                    className="px-4 py-2 rounded text-sm transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ fontFamily: 'var(--font-body)', background: 'var(--surface-2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
                  >
                    Redraw
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Film reel */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${spinning ? 'reel-spin' : ''}`}
              style={{ border: '2px solid var(--copper)', background: 'var(--surface-2)' }}
            >
              <Shuffle size={28} style={{ color: 'var(--copper)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', fontWeight: 600 }}>
              Ready to draw?
            </h2>
            <p className="mt-2 mb-6" style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {bucketCount > 0
                ? `${bucketCount} movie${bucketCount > 1 ? 's' : ''} waiting in the bucket`
                : 'Add movies to the bucket list first'}
            </p>
            <button
              onClick={drawMovie}
              disabled={drawing || bucketCount === 0}
              className="flex items-center gap-2.5 px-7 py-3 rounded text-sm font-medium transition-all disabled:opacity-40"
              style={{ fontFamily: 'var(--font-display)', background: 'var(--copper)', color: 'var(--cream)', letterSpacing: '0.04em' }}
            >
              <Shuffle size={15} />
              {drawing ? 'Drawing...' : 'Draw a movie'}
            </button>
          </div>
        )}
      </div>

      {/* Next draw date */}
      {nextDate && (
        <div className="flex items-center gap-3 px-4 py-3 rounded" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Calendar size={14} style={{ color: 'var(--copper)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
            Next draw:{' '}
            <span style={{ color: 'var(--text-dim)' }}>{format(new Date(nextDate), 'EEEE, MMMM d')}</span>
          </span>
        </div>
      )}
    </div>
  )
}
