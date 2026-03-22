'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { getTournamentDashboard } from '@/lib/api';
import type { TournamentDashboardResponse } from '@/lib/types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TournamentDashboard() {
  const [eventId, setEventId] = useState('');
  const [dashboard, setDashboard] = useState<TournamentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setEventId(searchInput);
    setLoading(true);
    try {
      const data = await getTournamentDashboard(searchInput);
      setDashboard(data);
    } catch (err) {
      console.error(err);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-foreground">Tournament Dashboard</h1>
          <p className="text-muted-foreground mt-1">Cross-player analysis and leaderboard</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="card p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter event ID..."
                className="w-full bg-input border border-border rounded px-3 py-2 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </form>

        {dashboard && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <p className="text-xs text-muted-foreground mb-1">Players</p>
                <p className="text-2xl font-bold text-foreground">{dashboard.players?.length || 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-muted-foreground mb-1">Alerts</p>
                <p className="text-2xl font-bold text-foreground">{dashboard.alerts?.length || 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-muted-foreground mb-1">Event</p>
                <p className="monospace text-sm text-foreground truncate">{eventId || 'N/A'}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-muted-foreground mb-1">Analysis Date</p>
                <p className="text-sm text-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Players Leaderboard */}
            {dashboard.players && dashboard.players.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Player Standings</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr className="text-muted-foreground">
                        <th className="text-left py-2 px-3">Rank</th>
                        <th className="text-left py-2 px-3">Player</th>
                        <th className="text-left py-2 px-3">Rating</th>
                        <th className="text-left py-2 px-3">Games</th>
                        <th className="text-left py-2 px-3">Score</th>
                        <th className="text-left py-2 px-3">Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.players.slice(0, 20).map((player, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition">
                          <td className="py-2 px-3 font-semibold text-foreground">{idx + 1}</td>
                          <td className="py-2 px-3 monospace text-sm">{player.player_id || player.name}</td>
                          <td className="py-2 px-3 text-foreground">{player.elo || player.rating || '—'}</td>
                          <td className="py-2 px-3 text-foreground">{player.games || '—'}</td>
                          <td className="py-2 px-3">
                            <span className="monospace text-sm">{(player.score || 0).toFixed(2)}</span>
                          </td>
                          <td className="py-2 px-3">
                            {player.flagged ? (
                              <span className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 font-semibold">
                                Flagged
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cross-Player Analysis Chart */}
            {dashboard.players && dashboard.players.length > 1 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Cross-Player Scatter</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      dataKey="elo"
                      name="Rating"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      type="number"
                      dataKey="score"
                      name="Risk Score"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Scatter
                      name="Players"
                      data={dashboard.players}
                      fill="hsl(var(--primary))"
                      opacity={0.6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Alerts */}
            {dashboard.alerts && dashboard.alerts.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Active Alerts ({dashboard.alerts.length})</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dashboard.alerts.slice(0, 10).map((alert, idx) => (
                    <div key={idx} className="p-3 bg-red-500/5 border border-red-500/30 rounded text-sm space-y-1">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-foreground">{alert.player_id}</p>
                        <span className="text-xs text-muted-foreground">{alert.created_at}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.message || 'Risk alert detected'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!dashboard && !loading && eventId && (
          <div className="card p-6 text-center">
            <p className="text-muted-foreground">No data found for this event</p>
          </div>
        )}

        {!eventId && !dashboard && (
          <div className="card p-12 text-center">
            <div className="space-y-4">
              <div className="text-5xl">📊</div>
              <h2 className="text-xl font-semibold text-foreground">Search for a tournament</h2>
              <p className="text-muted-foreground">Enter an event ID to view cross-player analysis and statistics</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
