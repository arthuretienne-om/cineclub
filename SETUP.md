# CineClub — Setup Guide

## 1. Create a Supabase project (free)

1. Go to [supabase.com](https://supabase.com) → New Project (free tier)
2. Open the **SQL Editor** in your project dashboard
3. Copy-paste the entire contents of `supabase-schema.sql` and run it
4. Go to **Project Settings → API** and copy:
   - Project URL : https://ftvetvhwrgnfvivzabla.supabase.co
   - `anon` public key : sb_publishable_EHd4viNRL0iC2H85EiChUA_lM6l5N7h

## 2. Get a TMDB API key (free)

1. Create an account at [themoviedb.org](https://www.themoviedb.org)
2. Go to **Settings → API** → Request an API Key (choose Developer)
3. Copy your **API Key (v3 auth)** : 91fe585b8b0ec84e1c1b76ff66877833
Jeton d'accès : eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MWZlNTg1YjhiMGVjODRlMWMxYjc2ZmY2Njg3NzgzMyIsIm5iZiI6MTc3NTU4NTEzNi44NjgsInN1YiI6IjY5ZDU0NzcwOWQ1Y2E3NDRkZWY4YThkOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pyMzGIXz7Ao-BglAuGQ67uoQL6V1mmyZhsp1spdq9Ow

## 3. Configure environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_key
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. In **Environment Variables**, add the same 3 vars from your `.env.local`
4. Deploy!

Share the Vercel URL with your sister and create accounts — you're ready to go.

## How to use

- **Home**: Draw a random movie from the bucket, set the frequency, mark as watched
- **Bucket**: Search for movies (via TMDB) and add them — both of you can add
- **Watched**: See all watched movies, leave ratings (⭐1-5) and comments
- **Chat**: Real-time chat — talk about what you want to watch next
