"use client";

import { useEffect, useMemo, useState } from "react";

import { AnalysisConsole } from "./analysis-console";

type DashboardPage =
  | "command"
  | "deep-dive"
  | "player"
  | "report"
  | "cases"
  | "live"
  | "tournament"
  | "partner"
  | "otb"
  | "admin";
type RiskTier = "LOW" | "MODERATE" | "ELEVATED" | "HIGH_STATISTICAL_ANOMALY";

type FeedGame = {
  game_id: string;
  event_id: string;
  player_id: string;
  official_elo: number;
  move_number: number;
  risk_tier: string;
  confidence: number;
  weighted_risk_score: number;
  sparkline: number[];
  audit_id: string;
  created_at: string;
};

type FeedAlert = {
  id: string;
  timestamp: string;
  event_id: string;
  player_id: string;
  layer: string;
  score: number;
  threshold: number;
  description: string;
  audit_id: string;
};

type FeedSummary = {
  total_games_analyzed_today: number;
  games_elevated_or_above: number;
  awaiting_review_count: number;
  average_regan_z_score: number;
};

type DashboardFeedResponse = {
  generated_at_utc: string;
  games: FeedGame[];
  alerts: FeedAlert[];
  summary: FeedSummary;
};

type SystemStatus = {
  generated_at_utc: string;
  calibration: {
    source?: string;
    profile_version?: string;
    band_count?: number;
    coverage_min_elo?: number | null;
    coverage_max_elo?: number | null;
    qa?: { ok?: boolean; failed_checks?: string[] };
  };
  ml_fusion: {
    enabled?: boolean;
    models_present?: boolean;
    primary?: { exists?: boolean; load_ok?: boolean | null };
    secondary?: { exists?: boolean; load_ok?: boolean | null };
  };
  maia: {
    path?: string | null;
    models_dir?: string | null;
    available_count?: number;
    version?: string;
    lc0_path?: string | null;
  };
  engine: { exists?: boolean };
  opening_book: { exists?: boolean };
  tablebase: { exists?: boolean };
  warnings: string[];
};

type CaseRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  title: string;
  event_id?: string | null;
  players: string[];
  summary?: string | null;
};

type CaseNote = {
  id: string;
  created_at: string;
  author?: string | null;
  note_type?: string | null;
  text?: string | null;
};

type PartnerKey = {
  id: string;
  key: string;
  secret: string;
  partner_name: string;
  webhook_url?: string | null;
  rate_limit_per_minute: number;
  active: boolean;
  created_at: string;
};

type OTBCameraEvent = {
  id: string;
  event_id?: string | null;
  case_id?: string | null;
  player_id?: string | null;
  session_id?: string | null;
  camera_id?: string | null;
  storage_mode?: string | null;
  summary?: Record<string, unknown>;
  created_at?: string;
};

type DGTBoardEvent = {
  id: string;
  event_id?: string | null;
  session_id?: string | null;
  board_serial?: string | null;
  move_uci?: string | null;
  ply?: number | null;
  clock_ms?: number | null;
  created_at?: string;
};

type Props = {
  apiBase: string;
  apiRole: string;
  apiFederationId: string;
  apiHealth: "healthy" | "degraded" | "offline" | string;
  apiLatencyMs: number | null;
  apiCheckedAt: string;
  supabaseReady: boolean;
  missingEnvVars: string[];
};

const RISK_CLASS: Record<RiskTier, string> = {
  LOW: "riskLow",
  MODERATE: "riskModerate",
  ELEVATED: "riskElevated",
  HIGH_STATISTICAL_ANOMALY: "riskHigh",
};

function normalizeRiskTier(value: string): RiskTier | null {
  if (value === "LOW" || value === "MODERATE" || value === "ELEVATED" || value === "HIGH_STATISTICAL_ANOMALY") {
    return value;
  }
  return null;
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) {
    return <div className="muted">None</div>;
  }
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * 100;
      const y = 100 - Math.max(0, Math.min(100, v * 100));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="sparkline" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

function RiskPill({ tier }: { tier: RiskTier | null }) {
  if (!tier) {
    return <span className="riskPill">NONE</span>;
  }
  return <span className={`riskPill ${RISK_CLASS[tier]}`}>{tier.replaceAll("_", " ")}</span>;
}

function formatClock(now: Date | null): string {
  if (!now) return "--:--:--";
  return now.toLocaleTimeString();
}

export function ArbiterDashboard({
  apiBase,
  apiRole,
  apiFederationId,
  apiHealth,
  apiLatencyMs,
  apiCheckedAt,
  supabaseReady,
  missingEnvVars,
}: Props) {
  const [page, setPage] = useState<DashboardPage>("command");
  const [feedGames, setFeedGames] = useState<FeedGame[]>([]);
  const [feedAlerts, setFeedAlerts] = useState<FeedAlert[]>([]);
  const [feedSummary, setFeedSummary] = useState<FeedSummary | null>(null);
  const [reviewedAlerts, setReviewedAlerts] = useState<Record<string, boolean>>({});
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemStatusError, setSystemStatusError] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseEventId, setCaseEventId] = useState("");
  const [casePlayers, setCasePlayers] = useState("");
  const [caseNoteText, setCaseNoteText] = useState("");
  const [partnerKeys, setPartnerKeys] = useState<PartnerKey[]>([]);
  const [partnerName, setPartnerName] = useState("");
  const [partnerWebhook, setPartnerWebhook] = useState("");
  const [reportAuditId, setReportAuditId] = useState("");
  const [reportCaseId, setReportCaseId] = useState("");
  const [reportMode, setReportMode] = useState("arbiter");
  const [reportFormat, setReportFormat] = useState("json");
  const [reportOutput, setReportOutput] = useState<string>("");
  const [liveSessionId, setLiveSessionId] = useState("");
  const [liveEvents, setLiveEvents] = useState<Array<Record<string, unknown>>>([]);
  const [liveRisk, setLiveRisk] = useState<Record<string, unknown> | null>(null);
  const [tournamentPlayers, setTournamentPlayers] = useState<Array<Record<string, unknown>>>([]);
  const [tournamentAlerts, setTournamentAlerts] = useState<Array<Record<string, unknown>>>([]);
  const [auditDetails, setAuditDetails] = useState<Record<string, unknown> | null>(null);
  const [otbEventId, setOtbEventId] = useState("");
  const [otbCameraEvents, setOtbCameraEvents] = useState<OTBCameraEvent[]>([]);
  const [otbBoardEvents, setOtbBoardEvents] = useState<DGTBoardEvent[]>([]);
  const [otbConnectStatus, setOtbConnectStatus] = useState<string>("");

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshFeed() {
      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
          "X-Role": apiRole,
        };
        if (apiFederationId) headers["X-Federation-Id"] = apiFederationId;
        const res = await fetch(`${apiBase}/v1/dashboard-feed?limit=200`, { cache: "no-store", headers });
        if (!res.ok) return;
        const feed = (await res.json()) as DashboardFeedResponse;
        if (cancelled) return;

        const games = Array.isArray(feed.games) ? feed.games : [];
        const alerts = Array.isArray(feed.alerts) ? feed.alerts : [];

        setFeedGames(games);
        setFeedAlerts(alerts);
        setFeedSummary(feed.summary ?? null);
        setSelectedGameId((prev) => (prev && games.some((g) => g.game_id === prev) ? prev : games[0]?.game_id ?? null));
      } catch {
        // Keep current state on network/server error.
      }
    }

    refreshFeed();
    const poll = setInterval(refreshFeed, 20000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [apiBase, apiRole, apiFederationId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshStatus() {
      try {
        setSystemStatusError(null);
        const headers: Record<string, string> = {
          Accept: "application/json",
          "X-Role": apiRole,
        };
        const res = await fetch(`${apiBase}/v1/system-status`, { cache: "no-store", headers });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { detail?: string };
          throw new Error(body.detail || `Status unavailable (${res.status})`);
        }
        const status = (await res.json()) as SystemStatus;
        if (!cancelled) setSystemStatus(status);
      } catch (err) {
        if (!cancelled) setSystemStatusError(err instanceof Error ? err.message : "Status unavailable");
      }
    }

    refreshStatus();
    const poll = setInterval(refreshStatus, 30000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [apiBase, apiRole]);

  function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Role": apiRole,
    };
    if (apiFederationId) headers["X-Federation-Id"] = apiFederationId;
    return headers;
  }

  useEffect(() => {
    let cancelled = false;
    async function loadCases() {
      try {
        const res = await fetch(`${apiBase}/v1/cases?limit=200`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = (await res.json()) as { cases?: CaseRecord[] };
        if (!cancelled) setCases(data.cases ?? []);
      } catch {
        // ignore
      }
    }
    loadCases();
    const poll = setInterval(loadCases, 30000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [apiBase, apiRole, apiFederationId]);

  useEffect(() => {
    let cancelled = false;
    async function loadPartnerKeys() {
      try {
        const res = await fetch(`${apiBase}/v1/partner/keys`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = (await res.json()) as { keys?: PartnerKey[] };
        if (!cancelled) setPartnerKeys(data.keys ?? []);
      } catch {
        // ignore
      }
    }
    loadPartnerKeys();
    return () => { cancelled = true; };
  }, [apiBase, apiRole, apiFederationId]);

  useEffect(() => {
    let cancelled = false;
    async function loadTournament() {
      try {
        const res = await fetch(`${apiBase}/v1/tournament-dashboard?limit=200`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = (await res.json()) as { players?: Array<Record<string, unknown>>; alerts?: Array<Record<string, unknown>> };
        if (!cancelled) {
          setTournamentPlayers(data.players ?? []);
          setTournamentAlerts(data.alerts ?? []);
        }
      } catch {
        // ignore
      }
    }
    loadTournament();
    return () => { cancelled = true; };
  }, [apiBase, apiRole, apiFederationId]);

  useEffect(() => {
    let cancelled = false;
    async function loadOtb() {
      if (page !== "otb") return;
      try {
        const query = otbEventId ? `?event_id=${encodeURIComponent(otbEventId)}` : "";
        const [cameraRes, boardRes] = await Promise.all([
          fetch(`${apiBase}/v1/otb/camera-events${query}`, { headers: authHeaders() }),
          fetch(`${apiBase}/v1/otb/board-events${query}`, { headers: authHeaders() }),
        ]);
        if (cameraRes.ok) {
          const data = (await cameraRes.json()) as { events?: OTBCameraEvent[] };
          if (!cancelled) setOtbCameraEvents(data.events ?? []);
        }
        if (boardRes.ok) {
          const data = (await boardRes.json()) as { events?: DGTBoardEvent[] };
          if (!cancelled) setOtbBoardEvents(data.events ?? []);
        }
      } catch {
        // ignore
      }
    }
    loadOtb();
    return () => { cancelled = true; };
  }, [apiBase, apiRole, apiFederationId, page, otbEventId]);

  const games = useMemo(() => [...feedGames].sort((a, b) => b.weighted_risk_score - a.weighted_risk_score), [feedGames]);
  const selectedGame = games.find((g) => g.game_id === selectedGameId) ?? null;
  const awaitingReview = Math.max(0, feedAlerts.filter((a) => !reviewedAlerts[a.id]).length);

  const navItems: Array<{ id: DashboardPage; label: string }> = [
    { id: "command", label: "Command Center" },
    { id: "deep-dive", label: "Game Deep Dive" },
    { id: "cases", label: "Cases" },
    { id: "live", label: "Live Monitor" },
    { id: "player", label: "Player Profile" },
    { id: "report", label: "Report Composer" },
    { id: "tournament", label: "Tournament" },
    { id: "partner", label: "Partner Keys" },
    { id: "otb", label: "OTB Monitor" },
    { id: "admin", label: "System Config" },
  ];

  const apiDotClass = apiHealth === "healthy" ? "ok" : apiHealth === "degraded" ? "warn" : "bad";
  const stockfishDotClass = systemStatus ? (systemStatus.engine?.exists ? "ok" : "bad") : "warn";
  const maiaReady = Boolean(systemStatus?.maia?.available_count && systemStatus?.maia?.lc0_path);
  const maiaDotClass = systemStatus
    ? (maiaReady ? "ok" : systemStatus.maia?.models_dir ? "warn" : "warn")
    : "warn";
  const mlDotClass = systemStatus
    ? (systemStatus.ml_fusion?.enabled
      ? (systemStatus.ml_fusion?.models_present ? "ok" : "warn")
      : "warn")
    : "warn";

  useEffect(() => {
    if (selectedGame?.audit_id) {
      loadAudit(selectedGame.audit_id);
    } else {
      setAuditDetails(null);
    }
  }, [selectedGame?.audit_id]);

  async function createCase() {
    const players = casePlayers.split(",").map((p) => p.trim()).filter(Boolean);
    const res = await fetch(`${apiBase}/v1/cases`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title: caseTitle, event_id: caseEventId || null, players }),
    });
    if (!res.ok) return;
    const created = (await res.json()) as CaseRecord;
    setCases((prev) => [created, ...prev]);
    setCaseTitle("");
    setCaseEventId("");
    setCasePlayers("");
  }

  async function loadCaseNotes(caseId: string) {
    const res = await fetch(`${apiBase}/v1/cases/${caseId}/notes`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = (await res.json()) as { notes?: CaseNote[] };
    setCaseNotes(data.notes ?? []);
  }

  async function loadAudit(auditId: string) {
    const res = await fetch(`${apiBase}/v1/audit/${auditId}`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = (await res.json()) as Record<string, unknown>;
    setAuditDetails(data);
  }

  async function addNote() {
    if (!selectedCaseId || !caseNoteText) return;
    const res = await fetch(`${apiBase}/v1/cases/${selectedCaseId}/notes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ text: caseNoteText }),
    });
    if (!res.ok) return;
    const note = (await res.json()) as CaseNote;
    setCaseNotes((prev) => [note, ...prev]);
    setCaseNoteText("");
  }

  async function generateReport() {
    setReportOutput("");
    const res = await fetch(`${apiBase}/v1/reports/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        audit_id: reportAuditId || null,
        case_id: reportCaseId || null,
        mode: reportMode,
        export_format: reportFormat,
      }),
    });
    if (!res.ok) {
      setReportOutput("Report generation failed.");
      return;
    }
    if (reportFormat === "pdf") {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setReportOutput(url);
      return;
    }
    const data = await res.json();
    setReportOutput(JSON.stringify(data, null, 2));
  }

  async function createPartnerKey() {
    const res = await fetch(`${apiBase}/v1/partner/keys/create`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ partner_name: partnerName, webhook_url: partnerWebhook || null }),
    });
    if (!res.ok) return;
    const key = (await res.json()) as PartnerKey;
    setPartnerKeys((prev) => [key, ...prev]);
    setPartnerName("");
    setPartnerWebhook("");
  }

  async function connectLive() {
    setLiveEvents([]);
    const socketUrl = `${apiBase.replace("http", "ws")}/ws/live/${liveSessionId}?role=${encodeURIComponent(apiRole)}`;
    const ws = new WebSocket(socketUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;
        setLiveEvents((prev) => [data, ...prev].slice(0, 200));
      } catch {
        // ignore
      }
    };
  }

  useEffect(() => {
    let cancelled = false;
    async function refreshLiveRisk() {
      if (!liveSessionId) return;
      try {
        const res = await fetch(`${apiBase}/v1/live/sessions/${liveSessionId}/risk`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = (await res.json()) as Record<string, unknown>;
        if (!cancelled) setLiveRisk(data);
      } catch {
        // ignore
      }
    }
    refreshLiveRisk();
    const poll = setInterval(refreshLiveRisk, 5000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [apiBase, apiRole, apiFederationId, liveSessionId]);

  return (
    <main className="dashRoot">
      <header className="topBar">
        <div>
          <div className="wordmark">Hamduk Labs Sentinel</div>
          <div className="muted">Forensic Arbiter Assistant</div>
        </div>
        <div className="topCenter">
          <div className="tourney">Sentinel Tournament - Live</div>
          <div className="monoData">
            {formatClock(now)} | Round remaining: None
          </div>
        </div>
        <div className="topRight">
          <div className="statusRow">
            <span className={`statusDot ${apiDotClass}`}>API</span>
            <span className={`statusDot ${supabaseReady ? "ok" : "bad"}`}>Supabase</span>
            <span className={`statusDot ${stockfishDotClass}`}>Stockfish</span>
            <span className={`statusDot ${mlDotClass}`}>ML Fusion</span>
            <span className={`statusDot ${maiaDotClass}`}>Maia</span>
            <span className="statusDot warn">DGT Feed</span>
          </div>
          <div className="arbiterMeta">
            <span className="monoData">Latency: {apiLatencyMs ?? "None"} ms</span>
            <span className="roleBadge">Checked {apiCheckedAt ? new Date(apiCheckedAt).toLocaleTimeString() : "None"}</span>
            <button className="escalateBtn" type="button">Emergency Escalation</button>
          </div>
        </div>
      </header>

      <nav className="dashNav">
        {navItems.map((item) => (
          <button key={item.id} className={page === item.id ? "navBtn active" : "navBtn"} onClick={() => setPage(item.id)} type="button">
            {item.label}
          </button>
        ))}
      </nav>

      {page === "command" ? (
        <section className="commandGrid">
          <section className="panel panelMain">
            <div className="panelHead">
              <h2>Live Game Feed</h2>
              <div className="muted">Sorted by weighted risk score</div>
            </div>
            {games.length === 0 ? (
              <div className="muted">None</div>
            ) : (
              <div className="gameGrid">
                {games.map((g, idx) => {
                  const tier = normalizeRiskTier(g.risk_tier);
                  return (
                    <article key={g.game_id} className="gameCard" onClick={() => { setSelectedGameId(g.game_id); setPage("deep-dive"); }}>
                      <div className="cardRow">
                        <div>
                          <strong>{g.player_id || "None"}</strong>
                          <div className="muted">FIDE {g.player_id || "None"} | {g.official_elo || "None"}</div>
                        </div>
                        <RiskPill tier={tier} />
                      </div>
                      <div className="muted">Event {g.event_id || "None"} | Move {g.move_number || "None"}</div>
                      <Sparkline values={g.sparkline || []} />
                      <div className="riskBar"><span style={{ width: `${Math.round((g.weighted_risk_score || 0) * 100)}%` }} /></div>
                      <div className="monoData">Weighted Risk: {Number.isFinite(g.weighted_risk_score) ? g.weighted_risk_score.toFixed(3) : "None"}</div>
                      <div className="muted">Board: {idx + 1} | Audit: {g.audit_id || "None"}</div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="panel panelSide">
            <div className="panelHead">
              <h2>Alert Queue</h2>
              <div className="muted">Chronological triggered signals</div>
            </div>
            {feedAlerts.length === 0 ? (
              <div className="muted">None</div>
            ) : (
              <div className="alertList">
                {feedAlerts.map((a) => (
                  <article className="alertItem" key={a.id}>
                    <div className="cardRow">
                      <strong>{a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : "None"}</strong>
                      <span className={reviewedAlerts[a.id] ? "miniBadge reviewed" : "miniBadge pending"}>
                        {reviewedAlerts[a.id] ? "Reviewed" : "Pending"}
                      </span>
                    </div>
                    <div>{a.player_id || "None"}</div>
                    <div className="muted">{a.layer || "None"}: {(a.score ?? 0).toFixed(2)} / {(a.threshold ?? 0).toFixed(2)}</div>
                    <div>{a.description || "None"}</div>
                    <div className="buttonRow">
                      <button type="button" className="ghostBtn" onClick={() => setReviewedAlerts((prev) => ({ ...prev, [a.id]: true }))}>Mark Reviewed</button>
                      <button type="button" className="warnBtn">Escalate</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="statsRow">
              <div><span className="monoData">{feedSummary?.total_games_analyzed_today ?? "None"}</span><div className="muted">Games Today</div></div>
              <div><span className="monoData">{feedSummary?.games_elevated_or_above ?? "None"}</span><div className="muted">Elevated+</div></div>
              <div><span className="monoData">{feedSummary ? awaitingReview : "None"}</span><div className="muted">Awaiting Review</div></div>
              <div><span className="monoData">{feedSummary ? feedSummary.average_regan_z_score.toFixed(3) : "None"}</span><div className="muted">Avg Regan Z</div></div>
            </div>
          </aside>

          <section className="panel pgnWorkbench">
            <div className="panelHead">
              <h2>PGN Analysis Workbench</h2>
              <div className="muted">Run direct PGN analysis from the dashboard</div>
            </div>
            <AnalysisConsole apiBase={apiBase} apiRole={apiRole} apiFederationId={apiFederationId} />
          </section>
        </section>
      ) : null}

      {page === "deep-dive" ? (
        <section className="stacked">
          <article className="panel">
            <div className="panelHead">
              <h2>Game Deep Dive</h2>
              <RiskPill tier={selectedGame ? normalizeRiskTier(selectedGame.risk_tier) : null} />
            </div>
            {selectedGame ? (
              <div className="muted">
                Player: {selectedGame.player_id || "None"} | Event: {selectedGame.event_id || "None"} | Move: {selectedGame.move_number || "None"} |
                Confidence: {Number.isFinite(selectedGame.confidence) ? selectedGame.confidence.toFixed(3) : "None"} |
                Audit ID: {selectedGame.audit_id || "None"}
              </div>
            ) : (
              <div className="muted">None</div>
            )}
          </article>
          <article className="panel">
            <h3>Charts</h3>
            <div className="muted">None</div>
          </article>
          <article className="panel">
            <h3>Behavioral Metrics</h3>
            {auditDetails && (auditDetails as any).response ? (
              <pre className="previewPane">
                {JSON.stringify((auditDetails as any).response?.behavioral_metrics ?? {}, null, 2)}
              </pre>
            ) : (
              <div className="muted">No behavioral telemetry available.</div>
            )}
          </article>
          <article className="panel">
            <h3>Move-by-Move Table</h3>
            <div className="muted">None</div>
          </article>
          <article className="panel">
            <h3>Arbiter Notes</h3>
            <div className="muted">None</div>
          </article>
        </section>
      ) : null}

      {page === "player" ? (
        <section className="stacked">
          <article className="panel"><h2>Player Profile</h2><div className="muted">None</div></article>
        </section>
      ) : null}

      {page === "cases" ? (
        <section className="stacked">
          <article className="panel">
            <div className="panelHead">
              <h2>Create Case</h2>
              <button className="ghostBtn" type="button" onClick={createCase}>Create</button>
            </div>
            <div className="formGrid">
              <input placeholder="Title" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />
              <input placeholder="Event ID (optional)" value={caseEventId} onChange={(e) => setCaseEventId(e.target.value)} />
              <input placeholder="Players (comma-separated)" value={casePlayers} onChange={(e) => setCasePlayers(e.target.value)} />
            </div>
          </article>
          <article className="panel">
            <div className="panelHead">
              <h2>Cases</h2>
              <div className="muted">{cases.length} total</div>
            </div>
            {cases.length === 0 ? (
              <div className="muted">None</div>
            ) : (
              <div className="alertList">
                {cases.map((c) => (
                  <article key={c.id} className="alertItem" onClick={() => { setSelectedCaseId(c.id); loadCaseNotes(c.id); }}>
                    <div className="cardRow">
                      <strong>{c.title}</strong>
                      <span className="miniBadge pending">{c.status}</span>
                    </div>
                    <div className="muted">Event: {c.event_id || "None"}</div>
                    <div className="muted">Players: {c.players.join(", ") || "None"}</div>
                  </article>
                ))}
              </div>
            )}
          </article>
          <article className="panel notesPanel">
            <div className="panelHead">
              <h2>Case Notes</h2>
              <button className="ghostBtn" type="button" onClick={addNote}>Add Note</button>
            </div>
            <textarea rows={4} placeholder="Add arbiter note..." value={caseNoteText} onChange={(e) => setCaseNoteText(e.target.value)} />
            <div className="alertList">
              {caseNotes.length ? caseNotes.map((n) => (
                <div className="alertItem" key={n.id}>
                  <div className="cardRow">
                    <strong>{n.author || "Arbiter"}</strong>
                    <span className="miniBadge reviewed">{n.created_at ? new Date(n.created_at).toLocaleTimeString() : ""}</span>
                  </div>
                  <div>{n.text || "Note"}</div>
                </div>
              )) : <div className="muted">No notes yet.</div>}
            </div>
          </article>
        </section>
      ) : null}

      {page === "live" ? (
        <section className="stacked">
          <article className="panel">
            <div className="panelHead">
              <h2>Live Monitor</h2>
              <button className="ghostBtn" type="button" onClick={connectLive}>Connect</button>
            </div>
            <div className="formGrid">
              <input placeholder="Session ID" value={liveSessionId} onChange={(e) => setLiveSessionId(e.target.value)} />
              <div className="muted">Connect to a live session to view events.</div>
            </div>
            <div className="monoData">Risk: {liveRisk ? JSON.stringify(liveRisk) : "None"}</div>
          </article>
          <article className="panel">
            <h2>Live Event Stream</h2>
            <div className="alertList">
              {liveEvents.length ? liveEvents.map((e, idx) => (
                <div className="alertItem" key={`evt-${idx}`}>
                  <pre className="monoData">{JSON.stringify(e)}</pre>
                </div>
              )) : <div className="muted">No events yet.</div>}
            </div>
          </article>
        </section>
      ) : null}

      {page === "report" ? (
        <section className="stacked">
          <article className="panel">
            <div className="panelHead">
              <h2>Report Composer</h2>
              <button className="ghostBtn" type="button" onClick={generateReport}>Generate</button>
            </div>
            <div className="formGrid">
              <input placeholder="Audit ID (optional)" value={reportAuditId} onChange={(e) => setReportAuditId(e.target.value)} />
              <input placeholder="Case ID (optional)" value={reportCaseId} onChange={(e) => setReportCaseId(e.target.value)} />
              <select value={reportMode} onChange={(e) => setReportMode(e.target.value)}>
                <option value="technical">Technical</option>
                <option value="arbiter">Arbiter</option>
                <option value="legal">Legal</option>
              </select>
              <select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            {reportFormat === "pdf" && reportOutput ? (
              <a className="ghostBtn" href={reportOutput} target="_blank" rel="noreferrer">Open PDF</a>
            ) : null}
            {reportOutput ? <pre className="previewPane">{reportOutput}</pre> : <div className="muted">No report generated yet.</div>}
          </article>
        </section>
      ) : null}

      {page === "tournament" ? (
        <section className="stacked">
          <article className="panel">
            <h2>Tournament Dashboard</h2>
            {tournamentPlayers.length ? (
              <div className="alertList">
                {tournamentPlayers.map((p, idx) => (
                  <div className="alertItem" key={`tp-${idx}`}>
                    <div className="cardRow">
                      <strong>{String(p.player_id || "player")}</strong>
                      <span className="miniBadge pending">{String(p.risk_tier || "")}</span>
                    </div>
                    <div className="muted">Avg Risk Score: {String(p.avg_risk_score || "")}</div>
                  </div>
                ))}
              </div>
            ) : <div className="muted">No tournament data yet.</div>}
          </article>
          <article className="panel">
            <h2>Alerts</h2>
            {tournamentAlerts.length ? (
              <div className="alertList">
                {tournamentAlerts.map((a, idx) => (
                  <div className="alertItem" key={`ta-${idx}`}>{String(a.message || "")}</div>
                ))}
              </div>
            ) : <div className="muted">No alerts.</div>}
          </article>
        </section>
      ) : null}

      {page === "partner" ? (
        <section className="stacked">
          <article className="panel">
            <div className="panelHead">
              <h2>Partner Keys</h2>
              <button className="ghostBtn" type="button" onClick={createPartnerKey}>Create</button>
            </div>
            <div className="formGrid">
              <input placeholder="Partner name" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
              <input placeholder="Webhook URL (optional)" value={partnerWebhook} onChange={(e) => setPartnerWebhook(e.target.value)} />
            </div>
          </article>
          <article className="panel">
            {partnerKeys.length ? (
              <div className="alertList">
                {partnerKeys.map((k) => (
                  <div className="alertItem" key={k.id}>
                    <div className="cardRow">
                      <strong>{k.partner_name}</strong>
                      <span className="miniBadge reviewed">{k.active ? "active" : "disabled"}</span>
                    </div>
                    <div className="monoData">Key: {k.key}</div>
                    <div className="monoData">Secret: {k.secret}</div>
                    <div className="muted">Webhook: {k.webhook_url || "None"}</div>
                  </div>
                ))}
              </div>
            ) : <div className="muted">No partner keys.</div>}
          </article>
        </section>
      ) : null}

      {page === "otb" ? (
        <section className="stacked">
          <article className="panel">
            <div className="panelHead">
              <h2>OTB Monitor</h2>
              <div className="muted">Camera events and DGT board feeds for OTB sessions.</div>
            </div>
            <div className="formGrid">
              <input placeholder="Event ID (optional)" value={otbEventId} onChange={(e) => setOtbEventId(e.target.value)} />
              <div className="muted">Filter by event to isolate a tournament or board batch.</div>
            </div>
            <div className="buttonRow">
              <button
                className="ghostBtn"
                type="button"
                onClick={async () => {
                  setOtbConnectStatus("");
                  const sdk = (window as any).SentinelSDK;
                  if (!sdk || typeof sdk.connectDgtWebSerial !== "function") {
                    setOtbConnectStatus("Sentinel SDK not loaded or missing DGT support.");
                    return;
                  }
                  try {
                    await sdk.connectDgtWebSerial({
                      eventId: otbEventId || undefined,
                      sessionId: liveSessionId || undefined,
                    });
                    setOtbConnectStatus("DGT board connected.");
                  } catch (err: any) {
                    setOtbConnectStatus(err?.message || "DGT connection failed.");
                  }
                }}
              >
                Connect DGT Board
              </button>
              {otbConnectStatus ? <div className="muted">{otbConnectStatus}</div> : null}
            </div>
            <div className="muted">
              Web Serial requires Chrome/Edge over HTTPS (or localhost) and a user gesture to select the board.
            </div>
          </article>
          <article className="panel">
            <div className="panelHead">
              <h2>OTB Camera Events</h2>
              <div className="muted">{otbCameraEvents.length} events</div>
            </div>
            {otbCameraEvents.length ? (
              <div className="alertList">
                {otbCameraEvents.map((evt) => (
                  <article className="alertItem" key={evt.id}>
                    <div className="cardRow">
                      <strong>{evt.player_id || "Unknown player"}</strong>
                      <span className="miniBadge pending">{evt.storage_mode || "safe"}</span>
                    </div>
                    <div className="muted">
                      Event: {evt.event_id || "None"} | Session: {evt.session_id || "None"} | Camera: {evt.camera_id || "None"}
                    </div>
                    <pre className="previewPane">{JSON.stringify(evt.summary ?? {}, null, 2)}</pre>
                  </article>
                ))}
              </div>
            ) : (
              <div className="muted">No camera events.</div>
            )}
          </article>
          <article className="panel">
            <div className="panelHead">
              <h2>DGT Board Events</h2>
              <div className="muted">{otbBoardEvents.length} events</div>
            </div>
            {otbBoardEvents.length ? (
              <div className="alertList">
                {otbBoardEvents.map((evt) => (
                  <article className="alertItem" key={evt.id}>
                    <div className="cardRow">
                      <strong>{evt.board_serial || "Board"}</strong>
                      <span className="miniBadge reviewed">{evt.session_id || "session"}</span>
                    </div>
                    <div className="muted">Event: {evt.event_id || "None"} | Move: {evt.move_uci || "None"} | Ply: {evt.ply ?? "None"}</div>
                    <div className="monoData">Clock: {evt.clock_ms ?? "None"} ms</div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="muted">No DGT board events.</div>
            )}
          </article>
        </section>
      ) : null}

      {page === "admin" ? (
        <section className="adminGrid">
          <article className="panel">
            <div className="panelHead">
              <h2>System Status</h2>
              <span className="badge on">Live</span>
            </div>
            {systemStatus ? (
              <>
                <div className="muted">Updated {new Date(systemStatus.generated_at_utc).toLocaleTimeString()}</div>
                <div className="monoData">Warnings: {systemStatus.warnings.length}</div>
                {systemStatus.warnings.length ? (
                  <div className="alertList">
                    {systemStatus.warnings.map((w) => (
                      <div className="miniBadge danger" key={w}>{w}</div>
                    ))}
                  </div>
                ) : (
                  <div className="miniBadge safe">No warnings</div>
                )}
              </>
            ) : (
              <div className="muted">{systemStatusError ?? "Loading..."}</div>
            )}
          </article>

          <article className="panel">
            <h2>Calibration Profile</h2>
            {systemStatus ? (
              <>
                <div className="muted">Source: {systemStatus.calibration?.source ?? "unknown"}</div>
                <div className="monoData">Version: {systemStatus.calibration?.profile_version ?? "unknown"}</div>
                <div className="monoData">Bands: {systemStatus.calibration?.band_count ?? "None"}</div>
                <div className="muted">
                  Coverage: {systemStatus.calibration?.coverage_min_elo ?? "None"} to {systemStatus.calibration?.coverage_max_elo ?? "None"}
                </div>
                <div className="muted">QA: {systemStatus.calibration?.qa?.ok === false ? "Failed" : "OK"}</div>
              </>
            ) : (
              <div className="muted">{systemStatusError ?? "Loading..."}</div>
            )}
          </article>

          <article className="panel">
            <h2>Model Artifacts</h2>
            {systemStatus ? (
              <>
                <div className="muted">ML Fusion: {systemStatus.ml_fusion?.enabled ? "Enabled" : "Disabled"}</div>
                <div className="monoData">Primary: {systemStatus.ml_fusion?.primary?.exists ? "Present" : "Missing"}</div>
                <div className="monoData">Secondary: {systemStatus.ml_fusion?.secondary?.exists ? "Present" : "Missing"}</div>
                <div className="muted">Maia Buckets: {systemStatus.maia?.available_count ?? 0}</div>
                <div className="muted">Maia LC0: {systemStatus.maia?.lc0_path ? "Configured" : "Missing"}</div>
                <div className="muted">Maia Version: {systemStatus.maia?.version ?? "unknown"}</div>
              </>
            ) : (
              <div className="muted">{systemStatusError ?? "Loading..."}</div>
            )}
          </article>

          <article className="panel">
            <h2>System Config</h2>
            <div className="muted">Missing env: {missingEnvVars.length ? missingEnvVars.join(", ") : "None"}</div>
            <div className="muted">Opening Book: {systemStatus?.opening_book?.exists ? "Present" : "Missing"}</div>
            <div className="muted">Tablebase: {systemStatus?.tablebase?.exists ? "Present" : "Missing"}</div>
          </article>
        </section>
      ) : null}

      <footer className="stickyDisclaimer">
        Statistical analysis only. All findings require human adjudication. This system does not determine guilt.
      </footer>
    </main>
  );
}
