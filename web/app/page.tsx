'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Clock, TrendingUp } from 'lucide-react';
import KPICard from '@/components/KPICard';
import RiskBadge from '@/components/RiskBadge';
import CopyableID from '@/components/CopyableID';
import { getDashboardFeed, getSystemStatus } from '@/lib/api';
import type { DashboardFeed, GameCard, SystemStatusResponse } from '@/lib/types';
import { formatRelativeTime, formatPercentage } from '@/lib/utils';

export default function ArbiterDashboard() {
  const [feed, setFeed] = useState<DashboardFeed | null>(null);
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [feedData, statusData] = await Promise.all([
          getDashboardFeed(200),
          getSystemStatus(),
        ]);
        setFeed(feedData);
        setStatus(statusData);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="card max-w-md p-6 border-red-500/50">
          <p className="text-red-400 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const summary = feed?.summary || { total_games_analyzed_today: 0, games_elevated_or_above: 0, awaiting_review_count: 0, average_regan_z_score: 0 };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl font-bold text-foreground">Sentinel Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time chess integrity monitoring</p>
          {feed?.generated_at_utc && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {formatRelativeTime(feed.generated_at_utc)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Games Analyzed"
            value={summary.total_games_analyzed_today}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <KPICard
            label="Elevated Risk"
            value={summary.games_elevated_or_above}
            trend="up"
            trendValue={`${((summary.games_elevated_or_above / Math.max(summary.total_games_analyzed_today, 1)) * 100).toFixed(1)}%`}
            icon={<AlertCircle className="w-5 h-5" />}
          />
          <KPICard
            label="Awaiting Review"
            value={summary.awaiting_review_count}
            icon={<Clock className="w-5 h-5" />}
          />
          <KPICard
            label="Avg Regan Z-Score"
            value={summary.average_regan_z_score.toFixed(2)}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {status && (
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">System Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              <StatusIndicator label="Engine" ready={status.analysis_pipeline_operational} />
              <StatusIndicator label="ML Models" ready={status.ml_models_loaded} />
              <StatusIndicator label="Maia" ready={status.maia_models_detected} />
              <StatusIndicator label="LC0" ready={status.lc0_ready} />
              <StatusIndicator label="Supabase" ready={status.supabase_configured} />
              <StatusIndicator label="RBAC" ready={status.rbac_enabled} />
            </div>
            {status.warnings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-yellow-400 font-semibold mb-1">Warnings:</p>
                <ul className="space-y-1">
                  {status.warnings.slice(0, 3).map((warning, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Games</h2>
          {feed?.games && feed.games.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground">
                    <th className="text-left py-2 px-3">Event / Player</th>
                    <th className="text-left py-2 px-3">Rating</th>
                    <th className="text-left py-2 px-3">Moves</th>
                    <th className="text-left py-2 px-3">Risk Tier</th>
                    <th className="text-left py-2 px-3">Score</th>
                    <th className="text-left py-2 px-3">Confidence</th>
                    <th className="text-left py-2 px-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {feed.games.slice(0, 20).map((game) => (
                    <tr key={game.game_id} className="border-b border-border/50 hover:bg-muted/50 transition">
                      <td className="py-2 px-3">
                        <div className="space-y-1">
                          <p className="text-foreground font-medium">{game.event_id}</p>
                          <CopyableID value={game.player_id} abbreviated />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-foreground">{game.official_elo}</td>
                      <td className="py-2 px-3 text-foreground">{game.move_number}</td>
                      <td className="py-2 px-3">
                        <RiskBadge tier={game.risk_tier} />
                      </td>
                      <td className="py-2 px-3">
                        <span className="monospace text-sm">{(game.weighted_risk_score * 100).toFixed(1)}</span>
                      </td>
                      <td className="py-2 px-3 text-sm text-muted-foreground">
                        {formatPercentage(game.confidence)}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {formatRelativeTime(game.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No games analyzed yet</p>
          )}
        </div>

        {feed?.alerts && feed.alerts.length > 0 && (
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-4">Active Alerts ({feed.alerts.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {feed.alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-muted/50 rounded border border-border text-sm space-y-1"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-foreground">{alert.layer}</p>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(alert.timestamp)}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{alert.description}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Score: <span className="monospace text-accent">{alert.score.toFixed(3)}</span></span>
                    <span>Threshold: <span className="monospace text-accent">{alert.threshold.toFixed(3)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusIndicator({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className={`p-2 rounded border text-xs text-center ${
      ready ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      <div className="font-semibold">{label}</div>
      <div className={ready ? 'text-green-600' : 'text-red-600'}>
        {ready ? '✓' : '✗'}
      </div>
    </div>
  );
}
