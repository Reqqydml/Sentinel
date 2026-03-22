import type {
  AnalyzeRequest,
  AnalyzePgnRequest,
  AnalyzeResponse,
  DashboardFeed,
  SystemStatusResponse,
  CaseRecord,
  TournamentSummaryResponse,
  PlayerProfileResponse,
  OTBIncidentRecord,
  TournamentDashboardResponse,
  LiveSessionCreateRequest,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions {
  headers?: Record<string, string>;
  role?: string;
  federationId?: string;
  apiKey?: string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & FetchOptions = {}
): Promise<T> {
  const { headers = {}, role = 'system_admin', federationId, apiKey, ...fetchOptions } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (role) {
    finalHeaders['X-Role'] = role;
  }
  if (federationId) {
    finalHeaders['X-Federation-Id'] = federationId;
  }
  if (apiKey) {
    finalHeaders['x-api-key'] = apiKey;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: finalHeaders,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Dashboard & Monitoring
export async function getDashboardFeed(limit = 200, eventId?: string, options?: FetchOptions): Promise<DashboardFeed> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (eventId) params.append('event_id', eventId);
  return apiFetch(`/v1/dashboard-feed?${params}`, options);
}

export async function getSystemStatus(options?: FetchOptions): Promise<SystemStatusResponse> {
  return apiFetch('/v1/system-status', options);
}

// Analysis
export async function analyze(req: AnalyzeRequest, options?: FetchOptions): Promise<AnalyzeResponse> {
  return apiFetch('/v1/analyze', {
    method: 'POST',
    body: JSON.stringify(req),
    ...options,
  });
}

export async function analyzePgn(req: AnalyzePgnRequest, options?: FetchOptions): Promise<AnalyzeResponse> {
  return apiFetch('/v1/analyze-pgn', {
    method: 'POST',
    body: JSON.stringify(req),
    ...options,
  });
}

export async function getTournamentSummary(req: AnalyzeRequest | AnalyzePgnRequest, options?: FetchOptions): Promise<TournamentSummaryResponse> {
  return apiFetch('/v1/tournament-summary', {
    method: 'POST',
    body: JSON.stringify(req),
    ...options,
  });
}

// Reports
export async function getReportStatus(auditId: string, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch(`/v1/reports/${auditId}`, options);
}

export async function lockReport(auditId: string, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch(`/v1/reports/${auditId}/lock`, {
    method: 'POST',
    ...options,
  });
}

export async function bumpReportVersion(auditId: string, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch(`/v1/reports/${auditId}/version`, {
    method: 'POST',
    ...options,
  });
}

export async function getAudit(auditId: string, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch(`/v1/audit/${auditId}`, options);
}

// Cases
export async function createCase(data: any, options?: FetchOptions): Promise<CaseRecord> {
  return apiFetch('/v1/cases', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function listCases(limit = 200, options?: FetchOptions): Promise<{ cases: CaseRecord[] }> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  return apiFetch(`/v1/cases?${params}`, options);
}

export async function getCase(caseId: string, options?: FetchOptions): Promise<CaseRecord> {
  return apiFetch(`/v1/cases/${caseId}`, options);
}

export async function updateCaseStatus(caseId: string, status: string, options?: FetchOptions): Promise<CaseRecord> {
  return apiFetch(`/v1/cases/${caseId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
    ...options,
  });
}

export async function addCaseNote(caseId: string, data: any, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch(`/v1/cases/${caseId}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function listCaseNotes(caseId: string, options?: FetchOptions): Promise<Array<Record<string, any>>> {
  return apiFetch(`/v1/cases/${caseId}/notes`, options);
}

// OTB Incidents
export async function createOTBIncident(data: any, options?: FetchOptions): Promise<OTBIncidentRecord> {
  return apiFetch('/v1/otb/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function listOTBIncidents(limit = 200, options?: FetchOptions): Promise<{ incidents: OTBIncidentRecord[] }> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  return apiFetch(`/v1/otb/incidents?${params}`, options);
}

// Player Profile
export async function getPlayerProfile(playerId: string, options?: FetchOptions): Promise<PlayerProfileResponse> {
  return apiFetch(`/v1/players/${playerId}/profile`, options);
}

// Tournament Dashboard
export async function getTournamentDashboard(eventId?: string, options?: FetchOptions): Promise<TournamentDashboardResponse> {
  const params = new URLSearchParams();
  if (eventId) params.append('event_id', eventId);
  return apiFetch(`/v1/tournament-dashboard?${params}`, options);
}

// Live Sessions
export async function createLiveSession(data: LiveSessionCreateRequest, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch('/v1/live/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function getLiveSession(sessionId: string, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch(`/v1/live/sessions/${sessionId}`, options);
}

export async function addLiveMove(sessionId: string, data: any, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch(`/v1/live/moves`, {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, ...data }),
    ...options,
  });
}

export async function getLiveSessionRisk(sessionId: string, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch(`/v1/live/sessions/${sessionId}/risk`, options);
}

// Visuals (for chessboard board state)
export async function getVisualsPgn(data: any, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch('/v1/visuals/pgn', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function getVisualsAnalyzePgn(data: any, options?: FetchOptions): Promise<Record<string, any>> {
  return apiFetch('/v1/visuals/analyze-pgn', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

// Health Check
export async function health(): Promise<{ status: string }> {
  return apiFetch('/health', { role: undefined });
}
