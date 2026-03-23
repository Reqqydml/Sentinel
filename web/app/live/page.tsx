'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Radio } from 'lucide-react';
import Link from 'next/link';
import { getLiveSession } from '@/lib/api';
import type { LiveSession } from '@/lib/types';
import ChessboardAnalyzer from '@/components/Chessboard';
import RiskBadge from '@/components/RiskBadge';

export default function LiveMonitor() {
  const [sessionId, setSessionId] = useState('');
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartMonitoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getLiveSession(sessionId);
      setSession(data);
      setIsMonitoring(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(async () => {
      try {
        const data = await getLiveSession(sessionId);
        setSession(data);
      } catch (err) {
        console.error('Failed to update session:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring, sessionId]);

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-2">
            <Radio className="w-8 h-8 animate-pulse text-accent" />
            Live Monitor
          </h1>
          <p className="text-muted-foreground mt-1">Real-time game integrity monitoring</p>
        </div>

        {!session ? (
          <form onSubmit={handleStartMonitoring} className="card p-6 max-w-md">
            <h2 className="font-semibold text-foreground mb-4">Start Monitoring</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Session ID
                </label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="session-123456"
                  className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4" />
                {loading ? 'Connecting...' : 'Start Monitoring'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chessboard */}
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Live Game</h2>
                <div className="flex gap-2">
                  <button className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition">
                    {isMonitoring ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSession(null);
                      setIsMonitoring(false);
                    }}
                    className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ChessboardAnalyzer readOnly squareWidth={50} />

              <div className="mt-4 p-3 bg-muted/30 rounded border border-border text-sm text-muted-foreground">
                <p>Moves: <span className="monospace font-bold">{session.move_count}</span></p>
                <p className="text-xs mt-1">{isMonitoring ? '🔴 Live' : '⚫ Paused'}</p>
              </div>
            </div>

            {/* Player Analysis */}
            <div className="space-y-4">
              {/* White */}
              <div className="card p-6">
                <p className="text-xs text-muted-foreground mb-2">White</p>
                <p className="font-semibold text-foreground mb-3">{session.white_player}</p>
                {session.white_rating && (
                  <p className="text-sm text-muted-foreground mb-3">Elo: {session.white_rating}</p>
                )}
                {session.risk_assessment && (
                  <RiskBadge tier={session.risk_assessment.white_tier as any} score={session.risk_assessment.white_score} />
                )}
              </div>

              {/* Black */}
              <div className="card p-6">
                <p className="text-xs text-muted-foreground mb-2">Black</p>
                <p className="font-semibold text-foreground mb-3">{session.black_player}</p>
                {session.black_rating && (
                  <p className="text-sm text-muted-foreground mb-3">Elo: {session.black_rating}</p>
                )}
                {session.risk_assessment && (
                  <RiskBadge tier={session.risk_assessment.black_tier as any} score={session.risk_assessment.black_score} />
                )}
              </div>

              {/* Event Info */}
              {session.event_id && (
                <div className="card p-6">
                  <p className="text-xs text-muted-foreground mb-2">Event</p>
                  <p className="monospace text-sm text-foreground">{session.event_id}</p>
                </div>
              )}

              {/* Session Info */}
              <div className="card p-6">
                <p className="text-xs text-muted-foreground mb-2">Session ID</p>
                <p className="monospace text-xs text-foreground break-all">{session.id}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
