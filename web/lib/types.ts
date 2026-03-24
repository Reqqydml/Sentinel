export type RiskTier = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH_STATISTICAL_ANOMALY';

export interface Signal {
  name: string;
  triggered: boolean;
  score: number;
  threshold: number;
  reasons: string[];
}

export interface MoveInput {
  ply: number;
  engine_best: string;
  player_move: string;
  cp_loss: number;
  top3_match?: boolean;
  maia_probability?: number;
  engine_rank?: number;
  legal_move_count?: number;
  complexity_score: number;
  candidate_moves_within_50cp: number;
  best_second_gap_cp?: number;
  eval_swing_cp?: number;
  best_eval_cp?: number;
  played_eval_cp?: number;
  is_opening_book?: boolean;
  is_tablebase?: boolean;
  is_forced?: boolean;
  time_spent_seconds?: number;
}

export interface GameInput {
  game_id: string;
  opponent_official_elo?: number;
  moves: MoveInput[];
}

export interface HistoricalProfile {
  games_count?: number;
  avg_acl?: number;
  std_acl?: number;
  avg_ipr?: number;
  std_ipr?: number;
  avg_perf?: number;
  std_perf?: number;
}

export interface AnalyzeRequest {
  player_id: string;
  event_id: string;
  event_type?: 'online' | 'otb';
  official_elo: number;
  high_stakes_event?: boolean;
  performance_rating_this_event?: number;
  games: GameInput[];
  historical?: HistoricalProfile;
  behavioral?: Record<string, any>;
}

export interface AnalyzePgnRequest {
  player_id: string;
  event_id: string;
  event_type?: 'online' | 'otb';
  opponent_player_id?: string;
  official_elo: number;
  player_color?: 'white' | 'black';
  high_stakes_event?: boolean;
  pgn_text: string;
  performance_rating_this_event?: number;
  historical?: HistoricalProfile;
}

export interface EvidenceReport {
  conclusion: string;
  engine_match_percentage: number;
  maia_agreement_percentage?: number;
  engine_maia_disagreement?: number;
  rating_band_index?: number;
  anomaly_score?: number;
  anomaly_source: string;
  centipawn_loss_statistics: Record<string, number>;
  position_difficulty_metrics: Record<string, number | string>;
  analysis_layers: Array<{ name: string; status: string; metrics: Record<string, any> }>;
  signals: Signal[];
  player_anomaly_scores: number[];
  player_anomaly_trend: number;
  player_anomaly_rolling_average: number;
  player_anomaly_spike_count: number;
  style_fingerprint: Record<string, any>;
  behavioral_metrics: Record<string, any>;
  environmental_metrics: Record<string, any>;
  identity_confidence: Record<string, any>;
  notes: string[];
}

export interface AnalyzeResponse {
  player_id: string;
  event_id: string;
  risk_tier: RiskTier;
  confidence: number;
  analyzed_move_count: number;
  triggered_signals: number;
  weighted_risk_score: number;
  signals: Signal[];
  explanation: string[];
  human_explanations: string[];
  audit_id: string;
  persisted_to_supabase: boolean;
  model_version?: string;
  feature_schema_version?: string;
  report_schema_version?: string;
  natural_occurrence_statement?: string;
  natural_occurrence_probability?: number;
  regan_z_score?: number;
  regan_threshold?: number;
  pep_score?: number;
  superhuman_move_rate?: number;
  rating_adjusted_move_probability?: number;
  opening_familiarity_index?: number;
  opponent_strength_correlation?: number;
  round_anomaly_clustering_score?: number;
  complex_blunder_rate?: number;
  zero_blunder_in_complex_games_flag?: boolean;
  move_quality_uniformity_score?: number;
  time_variance_anomaly_score?: number;
  time_clustering_anomaly_flag?: boolean;
  break_timing_correlation?: number;
  timing_confidence_score?: number;
  stockfish_maia_divergence?: number;
  maia_humanness_score?: number;
  maia_personalization_confidence?: number;
  maia_model_version?: string;
  rolling_12m_weighted_acl?: number;
  historical_volatility_score?: number;
  opponent_pool_adjustment?: number;
  multi_tournament_anomaly_score?: number;
  career_growth_curve_score?: number;
  ml_fusion_source?: string;
  ml_primary_score?: number;
  ml_secondary_score?: number;
  explainability_method?: string;
  explainability_items?: Array<Record<string, any>>;
  legal_disclaimer_text?: string;
  legal_disclaimer_enforced?: boolean;
  report_version?: number;
  report_locked?: boolean;
  report_locked_at?: string;
  confidence_intervals?: Record<string, number[] | null>;
  evidence_report?: EvidenceReport;
  behavioral_metrics?: Record<string, any>;
  environmental_metrics?: Record<string, any>;
  identity_confidence?: Record<string, any>;
}

export interface GameCard {
  game_id: string;
  event_id: string;
  player_id: string;
  official_elo: number;
  move_number: number;
  risk_tier: RiskTier;
  confidence: number;
  weighted_risk_score: number;
  sparkline: number[];
  audit_id: string;
  created_at: string;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  event_id: string;
  player_id: string;
  layer: string;
  score: number;
  threshold: number;
  description: string;
  audit_id: string;
}

export interface DashboardFeed {
  generated_at_utc: string;
  games: GameCard[];
  alerts: AlertItem[];
  summary: {
    total_games_analyzed_today: number;
    games_elevated_or_above: number;
    awaiting_review_count: number;
    average_regan_z_score: number;
  };
}

export interface SystemStatusResponse {
  generated_at_utc: string;
  app_env: string;
  model_version: string;
  feature_schema_version: string;
  report_schema_version: string;
  calibration: Record<string, any>;
  ml_fusion: Record<string, any>;
  maia: Record<string, any>;
  engine: Record<string, any>;
  opening_book: Record<string, any>;
  tablebase: Record<string, any>;
  supabase_configured: boolean;
  rbac_enabled: boolean;
  tenant_enforcement_enabled: boolean;
  lc0_ready: boolean;
  maia_models_detected: boolean;
  ml_models_loaded: boolean;
  analysis_pipeline_operational: boolean;
  warnings: string[];
}

export interface CaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  title: string;
  event_id?: string;
  players: string[];
  summary?: string;
  tags: string[];
  priority?: string;
  assigned_to?: string;
}

export interface TournamentGameSummary {
  game_id: string;
  analyzed_move_count: number;
  ipr_estimate: number;
  pep_score: number;
  regan_z_score: number;
  regan_threshold: number;
}

export interface TournamentSummaryResponse {
  player_id: string;
  event_id: string;
  event_type: string;
  games_count: number;
  analyzed_move_count: number;
  ipr_estimate: number;
  pep_score: number;
  regan_z_score: number;
  regan_threshold: number;
  confidence_intervals?: Record<string, number[] | null>;
  per_game: TournamentGameSummary[];
}

export interface PlayerProfileResponse {
  player_id: string;
  updated_at?: string;
  profile: Record<string, any>;
  history: Array<Record<string, any>>;
}

export interface OTBIncidentRecord {
  id: string;
  case_id?: string;
  event_id?: string;
  player_id?: string;
  incident_type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  occurred_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LiveSession {
  id: string;
  white_player: string;
  black_player: string;
  event_id?: string;
  current_fen: string;
  move_count: number;
  white_rating?: number;
  black_rating?: number;
  risk_assessment?: {
    white_score: number;
    black_score: number;
    white_tier: string;
    black_tier: string;
  };
  created_at: string;
  last_move_at: string;
}

export interface LiveSessionCreateRequest {
  event_id?: string;
  players: string[];
}

export interface CaseNote {
  id: string;
  content: string;
  created_at: string;
  created_by?: string;
}

export interface TournamentDashboardResponse {
  event_id?: string;
  players: Array<Record<string, any>>;
  alerts: Array<Record<string, any>>;
}
