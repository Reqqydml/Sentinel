-- Sentinel Anti-Cheat logical schema for Supabase/Postgres

create table if not exists players (
  id text primary key,
  fide_id text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id text primary key,
  name text,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references players(id),
  event_id text not null references events(id),
  risk_tier text not null,
  confidence numeric not null,
  analyzed_move_count int not null,
  triggered_signals int not null,
  model_version text not null,
  input_hash text not null,
  explanation jsonb not null,
  signals jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists games (
  id text primary key,
  event_id text not null references events(id),
  white_player_id text not null references players(id),
  black_player_id text not null references players(id),
  pgn text,
  created_at timestamptz not null default now()
);

create table if not exists move_features (
  id bigserial primary key,
  game_id text not null references games(id),
  ply int not null,
  cp_loss numeric,
  complexity_score int,
  is_opening_book boolean not null default false,
  is_tablebase boolean not null default false,
  is_forced boolean not null default false,
  time_spent_seconds numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_analyses_player_event on analyses(player_id, event_id, created_at desc);
create index if not exists idx_move_features_game_ply on move_features(game_id, ply);
