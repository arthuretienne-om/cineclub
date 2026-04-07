'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPosterUrl } from '@/lib/tmdb'
import { Movie, Settings, Frequency } from '@/lib/types'
import { Shuffle, Calendar, Film, Settings as SettingsIcon } from 'lucide-react'
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
}: {
  userId: string
  currentMovie: Movie | null
  settings: Settings | null
  bucketCount: number
}) {
  const [movie, setMovie] = useState<Movie | null>(currentMovie)
  const [freq, setFreq] = useState<Frequency>(settings?.frequency ?? 'biweekly')
  const [nextDate, setNextDate] = useState<string | null>(settings?.next_draw_date ?? null)
  const [drawing, setDrawing] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function drawMovie() {
    setDrawing(true)
    setSpinning(true)

    // Fetch all bucket movies
    const { data: bucket } = await supabase
      .from('movies')
      .select('*')
      .eq('status', 'bucket')

    if (!bucket || bucket.length === 0) {
      setDrawing(false)
      setSpinning(false)
      alert('No movies in the bucket! Add some first.')
      return
    }

    // Mark previous selected as bucket (reset) - simple: keep as-is
    if (movie) {
      await supabase.from('movies').update({ status: 'bucket', selected_at: null }).eq('id', movie.id)
    }

    // Pick random
    const picked = bucket[Math.floor(Math.random() * bucket.length)] as Movie

    // Mark as selected
    await supabase.from('movies').update({ status: 'selected', selected_at: new Date().toISOString() }).eq('id', picked.id)

    // Set next draw date
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {FREQUENCY_LABELS[freq]} · {bucketCount} in bucket
          </p>
        </div>
        <button
          onClick={() => setShowSettings(v => !v)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', background: showSettings ? 'var(--surface-2)' : 'transparent' }}
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* Frequency settings panel */}
      {showSettings && (
        <div className="rounded-xl p-4 pop-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Watch frequency</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map(f => (
              <button
                key={f}
                onClick={() => saveFrequency(f)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: freq === f ? 'var(--accent)' : 'var(--surface-2)',
                  color: freq === f ? '#0d0d0f' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {FREQUENCY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current movie */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {movie ? (
          <div className="flex gap-0">
            {/* Poster */}
            <div className="relative w-36 flex-shrink-0">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  width={144}
                  height={216}
                  className={`w-full h-full object-cover ${spinning ? 'draw-spin' : ''}`}
                  style={{ minHeight: 216 }}
                />
              ) : (
                <div className="w-full flex items-center justify-center" style={{ height: 216, background: 'var(--surface-2)' }}>
                  <Film size={40} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
                      Now watching
                    </p>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{movie.title}</h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {movie.release_date?.slice(0, 4)} · Added by {movie.added_by_name}
                    </p>
                  </div>
                </div>
                {movie.overview && (
                  <p className="text-sm mt-3 line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                    {movie.overview}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  onClick={markWatched}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: 'var(--accent)', color: '#0d0d0f' }}
                >
                  Mark as watched
                </button>
                <button
                  onClick={drawMovie}
                  disabled={drawing}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  Redraw
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${spinning ? 'draw-spin' : ''}`}
              style={{ background: 'var(--surface-2)' }}>
              <Shuffle size={32} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Ready to draw?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {bucketCount > 0
                ? `${bucketCount} movie${bucketCount > 1 ? 's' : ''} waiting in the bucket`
                : 'Add movies to the bucket list first'}
            </p>
            <button
              onClick={drawMovie}
              disabled={drawing || bucketCount === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#0d0d0f' }}
            >
              <Shuffle size={16} />
              {drawing ? 'Drawing…' : 'Draw a movie!'}
            </button>
          </div>
        )}
      </div>

      {/* Next draw date */}
      {nextDate && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Calendar size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Next draw: <span style={{ color: 'var(--text)' }}>{format(new Date(nextDate), 'EEEE, MMMM d')}</span>
          </span>
        </div>
      )}
    </div>
  )
}
