-- Sentinel Anti-Cheat logical schema for Supabase/Postgres

create extension if not exists pgcrypto;

create table if not exists federations (
  id text primary key,
  name text not null,
  code text unique,
  country_code text,
  policy_settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  auth_provider text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists federation_memberships (
  federation_id text not null references federations(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  role text not null check (role in ('arbiter', 'chief_arbiter', 'federation_admin', 'system_admin', 'analyst', 'reviewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  can_lock_reports boolean not null default false,
  can_sign_cases boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (federation_id, user_id, role)
);

create table if not exists players (
  id text primary key,
  fide_id text,
  display_name text,
  federation_id text references federations(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table players add column if not exists display_name text;
alter table players add column if not exists federation_id text;
alter table players add column if not exists metadata jsonb default '{}'::jsonb;

create table if not exists events (
  id text primary key,
  federation_id text references federations(id),
  name text,
  event_type text not null default 'online' check (event_type in ('online', 'otb')),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'completed', 'archived')),
  site text,
  round_count int,
  metadata jsonb not null default '{}'::jsonb,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

alter table events add column if not exists event_type text;
alter table events add column if not exists federation_id text;
alter table events add column if not exists status text;
alter table events add column if not exists site text;
alter table events add column if not exists round_count int;
alter table events add column if not exists metadata jsonb default '{}'::jsonb;

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references players(id),
  event_id text not null references events(id),
  federation_id text references federations(id),
  external_audit_id text unique,
  risk_tier text not null,
  confidence numeric not null,
  analyzed_move_count int not null,
  triggered_signals int not null,
  weighted_risk_score numeric,
  event_type text not null default 'online',
  regan_threshold_used numeric,
  natural_occurrence_statement text,
  natural_occurrence_probability numeric,
  model_version text not null,
  feature_schema_version text,
  report_schema_version text,
  report_version int not null default 1,
  report_locked boolean not null default false,
  report_locked_at timestamptz,
  legal_disclaimer_text text,
  human_review_required boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'under_review', 'escalated', 'closed')),
  explainability_method text,
  explainability_items jsonb,
  ml_fusion_source text,
  ml_primary_score numeric,
  ml_secondary_score numeric,
  input_hash text not null,
  explanation jsonb not null,
  signals jsonb not null,
  raw_request jsonb,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

alter table analyses add column if not exists external_audit_id text;
alter table analyses add column if not exists weighted_risk_score numeric;
alter table analyses add column if not exists event_type text;
alter table analyses add column if not exists federation_id text;
alter table analyses add column if not exists regan_threshold_used numeric;
alter table analyses add column if not exists natural_occurrence_statement text;
alter table analyses add column if not exists natural_occurrence_probability numeric;
alter table analyses add column if not exists feature_schema_version text;
alter table analyses add column if not exists report_schema_version text;
alter table analyses add column if not exists report_version int not null default 1;
alter table analyses add column if not exists report_locked boolean not null default false;
alter table analyses add column if not exists report_locked_at timestamptz;
alter table analyses add column if not exists legal_disclaimer_text text;
alter table analyses add column if not exists human_review_required boolean not null default false;
alter table analyses add column if not exists review_status text default 'pending';
alter table analyses add column if not exists explainability_method text;
alter table analyses add column if not exists explainability_items jsonb;
alter table analyses add column if not exists ml_fusion_source text;
alter table analyses add column if not exists ml_primary_score numeric;
alter table analyses add column if not exists ml_secondary_score numeric;
alter table analyses add column if not exists raw_request jsonb;
alter table analyses add column if not exists raw_response jsonb;

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
  engine_top1_match boolean,
  engine_top3_match boolean,
  maia_probability numeric,
  complexity_score int,
  is_opening_book boolean not null default false,
  is_tablebase boolean not null default false,
  is_forced boolean not null default false,
  time_spent_seconds numeric,
  created_at timestamptz not null default now()
);

alter table move_features add column if not exists engine_top1_match boolean;
alter table move_features add column if not exists engine_top3_match boolean;
alter table move_features add column if not exists maia_probability numeric;

create table if not exists engine_evals (
  id bigserial primary key,
  game_id text not null references games(id),
  move_number int not null,
  top1 text,
  top3 jsonb,
  centipawn_loss numeric,
  best_eval_cp numeric,
  played_eval_cp numeric,
  think_time numeric,
  created_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  federation_id text not null references federations(id),
  event_id text references events(id),
  player_id text not null references players(id),
  status text not null default 'open' check (status in ('open', 'under_review', 'escalated', 'closed')),
  severity text not null default 'moderate' check (severity in ('low', 'moderate', 'elevated', 'high_statistical_anomaly')),
  opened_by_user_id uuid references app_users(id),
  assigned_to_user_id uuid references app_users(id),
  latest_analysis_audit_id text references analyses(external_audit_id),
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists case_analyses (
  case_id uuid not null references cases(id) on delete cascade,
  analysis_external_audit_id text not null references analyses(external_audit_id) on delete cascade,
  attached_at timestamptz not null default now(),
  primary key (case_id, analysis_external_audit_id)
);

create table if not exists case_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  reviewer_user_id uuid references app_users(id),
  action text not null check (action in ('note', 'request_more_data', 'recommend_monitoring', 'recommend_escalation', 'close_case')),
  rationale text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists case_signoffs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  signer_user_id uuid references app_users(id),
  signer_role text not null,
  decision text not null check (decision in ('approved', 'rejected', 'returned_for_review')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists report_versions (
  id uuid primary key default gen_random_uuid(),
  analysis_external_audit_id text not null references analyses(external_audit_id) on delete cascade,
  version_no int not null,
  generated_by_user_id uuid references app_users(id),
  locked boolean not null default false,
  locked_at timestamptz,
  disclaimer_text text,
  report_body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (analysis_external_audit_id, version_no)
);

create table if not exists calibration_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null,
  profile_version text not null,
  schema_version int,
  source_dataset text,
  qa_report jsonb,
  profile_json jsonb not null,
  is_active boolean not null default false,
  created_by_user_id uuid references app_users(id),
  created_at timestamptz not null default now(),
  unique (profile_key, profile_version)
);

create table if not exists model_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_type text not null check (artifact_type in ('maia', 'xgboost', 'isolation_forest', 'shap_background', 'calibration_profile')),
  name text not null,
  version text not null,
  storage_path text,
  checksum_sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_by_user_id uuid references app_users(id),
  created_at timestamptz not null default now(),
  unique (artifact_type, name, version)
);

create table if not exists event_incidents (
  id uuid primary key default gen_random_uuid(),
  federation_id text references federations(id),
  event_id text not null references events(id) on delete cascade,
  source_system text not null,
  incident_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  author text,
  note_type text,
  structured jsonb not null default '{}'::jsonb,
  text text,
  created_at timestamptz not null default now()
);

create table if not exists case_evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  evidence_type text not null,
  label text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists case_flags (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  flag_type text not null,
  severity text not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists otb_incidents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  event_id text,
  player_id text,
  incident_type text not null,
  severity text not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  description text,
  occurred_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists report_exports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  analysis_external_audit_id text references analyses(external_audit_id) on delete cascade,
  report_type text not null,
  mode text not null check (mode in ('technical', 'arbiter', 'legal')),
  format text not null check (format in ('json', 'csv', 'pdf')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(),
  federation_id text references federations(id),
  event_id text references events(id) on delete cascade,
  players jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'paused', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists live_moves (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  ply int not null,
  move_uci text not null,
  time_spent numeric,
  clock_remaining numeric,
  complexity numeric,
  engine_match numeric,
  maia_prob numeric,
  tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists player_profiles (
  player_id text primary key references players(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists player_history (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references players(id) on delete cascade,
  event_id text references events(id),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists partner_api_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  key_hash text,
  secret text not null,
  partner_name text not null,
  webhook_url text,
  rate_limit_per_minute int not null default 60,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists partner_jobs (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  api_key_id uuid not null references partner_api_keys(id) on delete cascade,
  game_id text not null,
  player_id text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  risk_level text,
  risk_score numeric,
  result jsonb,
  webhook_url text,
  webhook_delivered boolean not null default false,
  webhook_attempts int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists partner_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  api_key_id uuid not null references partner_api_keys(id) on delete cascade,
  game_id text,
  player_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists partner_payloads (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references partner_jobs(job_id) on delete cascade,
  api_key_id uuid not null references partner_api_keys(id) on delete cascade,
  game_id text not null,
  player_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists device_fingerprints (
  fingerprint_hash text primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  last_player_id text,
  seen_count int not null default 1,
  distinct_players jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists camera_events (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  mode text not null check (mode in ('safe', 'raw')),
  events jsonb not null default '[]'::jsonb,
  consent jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists consent_logs (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  api_key_id uuid not null references partner_api_keys(id) on delete cascade,
  consent_type text not null,
  consent_given boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists otb_camera_events (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  case_id uuid references cases(id) on delete cascade,
  player_id text,
  session_id text,
  camera_id text,
  storage_mode text not null check (storage_mode in ('safe', 'raw')),
  consent jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists dgt_board_events (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  session_id uuid references live_sessions(id) on delete set null,
  board_serial text,
  move_uci text,
  ply int,
  fen text,
  clock_ms int,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analyses_player_event on analyses(player_id, event_id, created_at desc);
create index if not exists idx_analyses_federation_created on analyses(federation_id, created_at desc);
create index if not exists idx_analyses_review_status on analyses(review_status, created_at desc);
create index if not exists idx_move_features_game_ply on move_features(game_id, ply);
create index if not exists idx_engine_evals_game_move on engine_evals(game_id, move_number);
create index if not exists idx_players_federation on players(federation_id);
create index if not exists idx_events_federation_status on events(federation_id, status, created_at desc);
create index if not exists idx_cases_federation_status on cases(federation_id, status, created_at desc);
create index if not exists idx_case_reviews_case on case_reviews(case_id, created_at desc);
create index if not exists idx_report_versions_audit on report_versions(analysis_external_audit_id, version_no desc);
create index if not exists idx_calibration_profiles_key_active on calibration_profiles(profile_key, is_active, created_at desc);
create index if not exists idx_model_artifacts_type_active on model_artifacts(artifact_type, is_active, created_at desc);
create index if not exists idx_event_incidents_event_time on event_incidents(event_id, occurred_at desc);
create index if not exists idx_case_notes_case on case_notes(case_id, created_at desc);
create index if not exists idx_case_evidence_case on case_evidence(case_id, created_at desc);
create index if not exists idx_case_flags_case on case_flags(case_id, created_at desc);
create index if not exists idx_report_exports_case on report_exports(case_id, created_at desc);
create index if not exists idx_live_sessions_event on live_sessions(event_id, created_at desc);
create index if not exists idx_live_moves_session on live_moves(session_id, ply);
create index if not exists idx_player_history_player on player_history(player_id, created_at desc);
create index if not exists idx_partner_jobs_status on partner_jobs(status, created_at desc);
create index if not exists idx_partner_sessions_active on partner_sessions(status, created_at desc);
create index if not exists idx_partner_payloads_job on partner_payloads(job_id, created_at desc);
create index if not exists idx_device_fingerprints_last on device_fingerprints(last_seen desc);
create index if not exists idx_camera_events_job on camera_events(job_id, created_at desc);
create index if not exists idx_consent_logs_job on consent_logs(job_id, created_at desc);
create index if not exists idx_otb_camera_events_event on otb_camera_events(event_id, created_at desc);
create index if not exists idx_otb_camera_events_session on otb_camera_events(session_id, created_at desc);
create index if not exists idx_dgt_board_events_event on dgt_board_events(event_id, created_at desc);
