-- Run this in your Supabase SQL editor (https://supabase.com/dashboard)

-- Profiles (auto-created on sign up)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- Movies bucket list
create table if not exists movies (
  id uuid default gen_random_uuid() primary key,
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  overview text,
  release_date text,
  added_by uuid references profiles(id) on delete set null,
  added_by_name text not null,
  status text not null default 'bucket' check (status in ('bucket', 'selected', 'watched')),
  selected_at timestamptz,
  watched_at timestamptz,
  created_at timestamptz default now()
);

-- Reviews / ratings
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  movie_id uuid references movies(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  user_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(movie_id, user_id)
);

-- Chat messages
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  user_name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- App settings (single row)
create table if not exists settings (
  id integer primary key default 1 check (id = 1),
  frequency text not null default 'biweekly' check (frequency in ('weekly', 'biweekly', 'monthly')),
  next_draw_date timestamptz
);

insert into settings (id, frequency) values (1, 'biweekly') on conflict do nothing;

-- Auto-create profile on sign up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Enable Row Level Security
alter table profiles enable row level security;
alter table movies enable row level security;
alter table reviews enable row level security;
alter table messages enable row level security;
alter table settings enable row level security;

-- RLS Policies: authenticated users can read/write everything
create policy "Auth users can read profiles" on profiles for select to authenticated using (true);
create policy "Auth users can update own profile" on profiles for update to authenticated using (auth.uid() = id);

create policy "Auth users can read movies" on movies for select to authenticated using (true);
create policy "Auth users can insert movies" on movies for insert to authenticated with check (auth.uid() = added_by);
create policy "Auth users can update movies" on movies for update to authenticated using (true);
create policy "Auth users can delete own movies" on movies for delete to authenticated using (auth.uid() = added_by);

create policy "Auth users can read reviews" on reviews for select to authenticated using (true);
create policy "Auth users can insert own review" on reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "Auth users can update own review" on reviews for update to authenticated using (auth.uid() = user_id);
create policy "Auth users can delete own review" on reviews for delete to authenticated using (auth.uid() = user_id);

create policy "Auth users can read messages" on messages for select to authenticated using (true);
create policy "Auth users can insert messages" on messages for insert to authenticated with check (auth.uid() = user_id);

create policy "Auth users can read settings" on settings for select to authenticated using (true);
create policy "Auth users can update settings" on settings for update to authenticated using (true);

-- Enable realtime for chat
alter publication supabase_realtime add table messages;
