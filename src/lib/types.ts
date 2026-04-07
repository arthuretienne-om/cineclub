export type MovieStatus = 'bucket' | 'selected' | 'watched'
export type Frequency = 'weekly' | 'biweekly' | 'monthly'

export interface Movie {
  id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  overview: string
  release_date: string
  added_by: string
  added_by_name: string
  status: MovieStatus
  selected_at: string | null
  watched_at: string | null
  created_at: string
}

export interface Review {
  id: string
  movie_id: string
  user_id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export interface Settings {
  id: string
  frequency: Frequency
  next_draw_date: string | null
}

export interface Profile {
  id: string
  name: string
  email: string
}
