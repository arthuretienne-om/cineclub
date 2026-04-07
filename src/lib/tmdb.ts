const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

export function getPosterUrl(path: string | null) {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}${path}`
}

export async function searchMovies(query: string) {
  const res = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.results.slice(0, 8) as TmdbMovie[]
}

export async function getMovieDetails(tmdbId: number) {
  const res = await fetch(
    `${TMDB_BASE}/movie/${tmdbId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
  )
  if (!res.ok) return null
  return res.json() as Promise<TmdbMovie>
}

export interface TmdbMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  genre_ids?: number[]
  runtime?: number
}
