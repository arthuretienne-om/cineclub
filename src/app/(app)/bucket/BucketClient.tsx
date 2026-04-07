'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { searchMovies, getPosterUrl, TmdbMovie } from '@/lib/tmdb'
import { Movie } from '@/lib/types'
import { Search, Plus, Trash2, Film, X } from 'lucide-react'
import Image from 'next/image'

export default function BucketClient({ userId, movies: initial }: { userId: string; movies: Movie[] }) {
  const [movies, setMovies] = useState<Movie[]>(initial)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TmdbMovie[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<number | null>(null)
  const supabase = createClient()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    const res = await searchMovies(query)
    setResults(res)
    setSearching(false)
  }

  async function addMovie(tmdb: TmdbMovie) {
    setAdding(tmdb.id)
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
    const { data, error } = await supabase.from('movies').insert({
      tmdb_id: tmdb.id,
      title: tmdb.title,
      poster_path: tmdb.poster_path,
      overview: tmdb.overview,
      release_date: tmdb.release_date,
      added_by: userId,
      added_by_name: profile?.name ?? 'You',
      status: 'bucket',
    }).select().single()
    if (!error && data) {
      setMovies(prev => [data, ...prev])
      setResults(prev => prev.filter(r => r.id !== tmdb.id))
    }
    setAdding(null)
  }

  async function removeMovie(id: string) {
    await supabase.from('movies').delete().eq('id', id)
    setMovies(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="space-y-6 curtain-in">
      {/* Header */}
      <div>
        <span className="marquee">Selection</span>
        <h1 className="mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--cream)', fontWeight: 700 }}>
          Bucket List
        </h1>
        <p className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {movies.length} film{movies.length !== 1 ? 's' : ''} in the queue
        </p>
      </div>

      {/* Search bar — ticket style */}
      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search a film title..."
              className="w-full pl-10 pr-4 py-2.5 rounded text-sm outline-none transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2 rounded text-sm font-medium transition-all hover:opacity-85 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-display)', background: 'var(--copper)', color: 'var(--cream)', letterSpacing: '0.03em' }}
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Search results */}
      {results.length > 0 && (
        <div className="ticket rounded-lg overflow-hidden curtain-in">
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Results — {results.length} films
            </span>
            <button onClick={() => setResults([])} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
          <div>
            {results.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
              >
                {r.poster_path ? (
                  <Image src={getPosterUrl(r.poster_path)!} alt={r.title} width={32} height={48} className="rounded object-cover flex-shrink-0" style={{ border: '1px solid var(--border)' }} />
                ) : (
                  <div className="w-8 h-12 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <Film size={12} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 600 }}>{r.title}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{r.release_date?.slice(0, 4)}</p>
                </div>
                <button
                  onClick={() => addMovie(r)}
                  disabled={adding === r.id || movies.some(m => m.tmdb_id === r.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all disabled:opacity-40"
                  style={{ fontFamily: 'var(--font-body)', background: movies.some(m => m.tmdb_id === r.id) ? 'var(--surface-3)' : 'var(--copper)', color: 'var(--cream)', border: '1px solid transparent' }}
                >
                  <Plus size={11} />
                  {movies.some(m => m.tmdb_id === r.id) ? 'Added' : adding === r.id ? '...' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bucket list */}
      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Film size={36} className="mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No films in the queue yet.
          </p>
          <p className="mt-1" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Search above to add your first pick.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {movies.map(m => (
            <div
              key={m.id}
              className="flex gap-3 p-3 rounded-lg transition-colors hover:border-[var(--border-light)]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {m.poster_path ? (
                <Image
                  src={getPosterUrl(m.poster_path)!}
                  alt={m.title}
                  width={52}
                  height={78}
                  className="rounded object-cover flex-shrink-0"
                  style={{ border: '1px solid var(--border)' }}
                />
              ) : (
                <div className="w-13 h-20 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <Film size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--cream)', fontWeight: 600, lineHeight: 1.3 }}>{m.title}</p>
                <p className="mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  {m.release_date?.slice(0, 4)} &middot; {m.added_by_name}
                </p>
                {m.overview && (
                  <p className="mt-1.5 line-clamp-2" style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {m.overview}
                  </p>
                )}
              </div>
              {m.added_by === userId && (
                <button
                  onClick={() => removeMovie(m.id)}
                  className="flex-shrink-0 self-start p-1.5 rounded transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
