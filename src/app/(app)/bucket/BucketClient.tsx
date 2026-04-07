'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Bucket List</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {movies.length} movie{movies.length !== 1 ? 's' : ''} waiting to be watched
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a movie to add…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#0d0d0f' }}
        >
          {searching ? '…' : 'Search'}
        </button>
      </form>

      {/* Search results */}
      {results.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--surface-2)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Search results</span>
            <button onClick={() => setResults([])}><X size={14} style={{ color: 'var(--text-muted)' }} /></button>
          </div>
          <div className="divide-y" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {results.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                {r.poster_path ? (
                  <Image src={getPosterUrl(r.poster_path)!} alt={r.title} width={36} height={54} className="rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-14 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)' }}>
                    <Film size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{r.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.release_date?.slice(0, 4)}</p>
                </div>
                <button
                  onClick={() => addMovie(r)}
                  disabled={adding === r.id || movies.some(m => m.tmdb_id === r.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: '#0d0d0f' }}
                >
                  <Plus size={12} />
                  {movies.some(m => m.tmdb_id === r.id) ? 'Added' : adding === r.id ? '…' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bucket list */}
      {movies.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Film size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No movies yet. Search above to add some!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {movies.map(m => (
            <div key={m.id} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {m.poster_path ? (
                <Image src={getPosterUrl(m.poster_path)!} alt={m.title} width={56} height={84} className="rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-20 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)' }}>
                  <Film size={20} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug" style={{ color: 'var(--text)' }}>{m.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {m.release_date?.slice(0, 4)} · by {m.added_by_name}
                </p>
                {m.overview && (
                  <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{m.overview}</p>
                )}
              </div>
              {m.added_by === userId && (
                <button
                  onClick={() => removeMovie(m.id)}
                  className="flex-shrink-0 self-start p-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
