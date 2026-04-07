'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPosterUrl } from '@/lib/tmdb'
import { Movie, Review } from '@/lib/types'
import { Film } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

function FilmStars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const symbols = ['✦', '✦', '✦', '✦', '✦']

  return (
    <div className="flex gap-0.5">
      {symbols.map((sym, i) => {
        const filled = (hovered || value) > i
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i + 1)}
            onMouseEnter={() => onChange && setHovered(i + 1)}
            onMouseLeave={() => onChange && setHovered(0)}
            className={onChange ? 'star-btn' : ''}
            disabled={!onChange}
            style={{ background: 'none', border: 'none', padding: '0 1px', fontSize: '0.75rem', color: filled ? 'var(--copper)' : 'var(--border-light)', lineHeight: 1 }}
          >
            {sym}
          </button>
        )
      })}
    </div>
  )
}

function ReviewForm({ movieId, userId, existing, onSave }: {
  movieId: string
  userId: string
  existing?: Review
  onSave: (r: Review) => void
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    if (!rating) return
    setSaving(true)
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
    const payload = { movie_id: movieId, user_id: userId, user_name: profile?.name ?? 'You', rating, comment }
    let result
    if (existing) {
      result = await supabase.from('reviews').update({ rating, comment }).eq('id', existing.id).select().single()
    } else {
      result = await supabase.from('reviews').insert(payload).select().single()
    }
    if (result.data) onSave(result.data)
    setSaving(false)
  }

  return (
    <div className="p-4 rounded-lg space-y-3 pop-in" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div>
        <p className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Your rating
        </p>
        <div className="flex items-center gap-3">
          <FilmStars value={rating} onChange={setRating} />
          {rating > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{rating}/5</span>
          )}
        </div>
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Your thoughts on this film..."
        rows={2}
        className="w-full px-3 py-2.5 rounded text-sm resize-none outline-none transition-all"
        style={{
          fontFamily: 'var(--font-body)',
          background: 'var(--surface-3)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          lineHeight: 1.5,
        }}
      />
      <button
        onClick={handleSave}
        disabled={!rating || saving}
        className="px-4 py-1.5 rounded text-sm transition-opacity disabled:opacity-40"
        style={{ fontFamily: 'var(--font-display)', background: 'var(--copper)', color: 'var(--cream)', fontWeight: 600, letterSpacing: '0.03em' }}
      >
        {saving ? 'Saving...' : existing ? 'Update review' : 'Save review'}
      </button>
    </div>
  )
}

export default function WatchedClient({
  userId,
  movies,
  reviews: initialReviews,
}: {
  userId: string
  movies: Movie[]
  reviews: Review[]
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [openReview, setOpenReview] = useState<string | null>(null)

  function getReviews(movieId: string) {
    return reviews.filter(r => r.movie_id === movieId)
  }

  function getMyReview(movieId: string) {
    return reviews.find(r => r.movie_id === movieId && r.user_id === userId)
  }

  function handleReviewSave(r: Review) {
    setReviews(prev => {
      const idx = prev.findIndex(x => x.id === r.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = r; return next }
      return [r, ...prev]
    })
  }

  return (
    <div className="space-y-6 curtain-in">
      <div>
        <span className="marquee">Archives</span>
        <h1 className="mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--cream)', fontWeight: 700 }}>
          Watched
        </h1>
        <p className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {movies.length} film{movies.length !== 1 ? 's' : ''} in the archive
        </p>
      </div>

      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Film size={36} className="mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No films watched yet.
          </p>
          <p className="mt-1" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Draw a movie and mark it as watched.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {movies.map(m => {
            const movieReviews = getReviews(m.id)
            const myReview = getMyReview(m.id)
            const isOpen = openReview === m.id
            const avgRating = movieReviews.length
              ? movieReviews.reduce((s, r) => s + r.rating, 0) / movieReviews.length
              : 0

            return (
              <div key={m.id} className="ticket rounded-lg overflow-hidden">
                <div className="flex gap-4 p-4">
                  {m.poster_path ? (
                    <Image
                      src={getPosterUrl(m.poster_path)!}
                      alt={m.title}
                      width={68}
                      height={102}
                      className="rounded object-cover flex-shrink-0"
                      style={{ border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <div className="w-16 h-24 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <Film size={20} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream)', fontWeight: 700, lineHeight: 1.2 }}>
                      {m.title}
                    </h3>
                    <p className="mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                      {m.release_date?.slice(0, 4)}
                      {m.watched_at ? ` · ${format(new Date(m.watched_at), 'MMM d, yyyy')}` : ''}
                    </p>

                    {avgRating > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <FilmStars value={Math.round(avgRating)} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                          {avgRating.toFixed(1)} avg
                        </span>
                      </div>
                    )}

                    {movieReviews.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        {movieReviews.map(r => (
                          <div key={r.id} className="flex items-start gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: 'var(--copper-dim)', fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: 'var(--cream)', fontWeight: 700 }}
                            >
                              {r.user_name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>{r.user_name}</span>
                                <FilmStars value={r.rating} />
                              </div>
                              {r.comment && (
                                <p className="mt-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, fontStyle: 'italic' }}>
                                  &ldquo;{r.comment}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setOpenReview(isOpen ? null : m.id)}
                      className="mt-2.5 transition-opacity hover:opacity-70"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--copper)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    >
                      {myReview ? '✎ Edit review' : '+ Write review'}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4">
                    <ReviewForm
                      movieId={m.id}
                      userId={userId}
                      existing={myReview}
                      onSave={r => { handleReviewSave(r); setOpenReview(null) }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
