'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPosterUrl } from '@/lib/tmdb'
import { Movie, Review } from '@/lib/types'
import { Film, Star } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'star-btn' : ''}
          disabled={!onChange}
        >
          <Star
            size={16}
            fill={(hovered || value) >= s ? 'var(--accent)' : 'transparent'}
            style={{ color: 'var(--accent)' }}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewForm({
  movieId,
  userId,
  existing,
  onSave,
}: {
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

    const payload = {
      movie_id: movieId,
      user_id: userId,
      user_name: profile?.name ?? 'You',
      rating,
      comment,
    }

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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rating}/5</span>
        )}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Your thoughts… (optional)"
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      />
      <button
        onClick={handleSave}
        disabled={!rating || saving}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: 'var(--accent)', color: '#0d0d0f' }}
      >
        {saving ? 'Saving…' : existing ? 'Update' : 'Save review'}
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Watched</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {movies.length} movie{movies.length !== 1 ? 's' : ''} watched together
        </p>
      </div>

      {movies.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Film size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No watched movies yet. Draw one and watch it!</p>
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
              <div key={m.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {/* Movie row */}
                <div className="flex gap-4 p-4">
                  {m.poster_path ? (
                    <Image
                      src={getPosterUrl(m.poster_path)!}
                      alt={m.title}
                      width={72}
                      height={108}
                      className="rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-18 h-24 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)' }}>
                      <Film size={24} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold" style={{ color: 'var(--text)' }}>{m.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {m.release_date?.slice(0, 4)}
                      {m.watched_at ? ` · Watched ${format(new Date(m.watched_at), 'MMM d, yyyy')}` : ''}
                    </p>

                    {/* Average rating */}
                    {avgRating > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <StarRating value={Math.round(avgRating)} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {avgRating.toFixed(1)} avg
                        </span>
                      </div>
                    )}

                    {/* Existing reviews */}
                    {movieReviews.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {movieReviews.map(r => (
                          <div key={r.id} className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: 'var(--surface-2)', color: 'var(--accent)' }}>
                              {r.user_name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{r.user_name}</span>
                                <StarRating value={r.rating} />
                              </div>
                              {r.comment && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.comment}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setOpenReview(isOpen ? null : m.id)}
                      className="text-xs mt-2 font-medium transition-opacity hover:opacity-70"
                      style={{ color: 'var(--accent)' }}
                    >
                      {myReview ? 'Edit your review' : '+ Add review'}
                    </button>
                  </div>
                </div>

                {/* Review form */}
                {isOpen && (
                  <div className="px-4 pb-4 pop-in">
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
