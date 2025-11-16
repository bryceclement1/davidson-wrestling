-- WrestleMetrics schema reference (v1.2)
create table if not exists public.wrestlers (
  id bigserial primary key,
  name text not null,
  class_year text,
  primary_weight_class text,
  active boolean default true,
  user_id uuid references auth.users(id),
  created_at timestamptz default timezone('utc', now())
);

create table if not exists public.seasons (
  id bigserial primary key,
  name text not null,
  start_date date,
  end_date date
);

create table if not exists public.events (
  id bigserial primary key,
  name text not null,
  event_type text not null check (event_type in ('dual', 'tournament')) default 'dual',
  date date not null,
  opponent_school text,
  created_at timestamptz default timezone('utc', now())
);

create table if not exists public.matches (
  id bigserial primary key,
  wrestler_id bigint not null references public.wrestlers(id),
  season_id bigint references public.seasons(id),
  event_id bigint references public.events(id),
  opponent_name text not null,
  opponent_school text,
  weight_class text,
  match_type text check (match_type in ('dual', 'tournament')) default 'dual',
  event_name text,
  date date not null,
  result text check (result in ('W', 'L', 'D', 'FF')) default 'W',
  our_score integer default 0,
  opponent_score integer default 0,
  first_takedown_scorer text check (first_takedown_scorer in ('us', 'opponent', 'none')) default 'none',
  our_riding_time_seconds integer default 0,
  opponent_riding_time_seconds integer default 0,
  created_at timestamptz default timezone('utc', now())
);

create table if not exists public.match_events (
  id bigserial primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  action_type text check (
    action_type in ('takedown', 'takedown_attempt', 'escape', 'reversal', 'nearfall')
  ) not null,
  period_order smallint not null,
  period_type text check (period_type in ('reg', 'ot', 'tb')) not null,
  period_number smallint not null,
  scorer text check (scorer in ('us', 'opponent', 'none')) not null,
  attacker text check (attacker in ('us', 'opponent')),
  takedown_type text check (
    takedown_type in ('single', 'double', 'high_c', 'ankle_pick', 'throw', 'trip', 'other')
  ),
  points smallint check (points in (2, 3, 4)),
  created_at timestamptz default timezone('utc', now())
);

create table if not exists public.users (
  id uuid primary key references auth.users(id),
  email text not null unique,
  name text,
  role text not null default 'standard' check (role in ('admin', 'standard')),
  wrestler_id bigint references public.wrestlers(id),
  created_at timestamptz default timezone('utc', now())
);
