'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import ChessboardAnalyzer from '@/components/Chessboard';
import RiskBadge from '@/components/RiskBadge';
import CopyableID from '@/components/CopyableID';
import { getAudit } from '@/lib/api';
import type { AnalyzeResponse } from '@/lib/types';
import { formatRelativeTime, formatPercentage, formatZScore, formatCentipawns } from '@/lib/utils';

function AnalysisDetailInner() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get('id');
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'stats' | 'signals' | 'evidence' | 'behavioral' | 'report'>('board');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!auditId) return;

    const loadAudit = async () => {
      try {
        const data = await getAudit(auditId);
        setAudit(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadAudit();
  }, [auditId]);

  if (!auditId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-400">No audit ID provided</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-400">{error || 'Analysis not found'}</p>
        </div>
      </div>
    );
  }

  const response = audit.response;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(auditId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'board', label: 'Board Replay' },
    { id: 'stats', label: 'Statistics' },
    { id: 'signals', label: 'Signals' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'report', label: 'Report' },
  ] as const;

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {response?.player_id}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Event: <span className="text-foreground">{response?.event_id}</span></span>
                <span>Elo: <span className="text-foreground">{response?.official_elo}</span></span>
                <span>Moves: <span className="text-foreground">{response?.analyzed_move_count}</span></span>
              </div>
            </div>
            <div className="text-right">
              <RiskBadge tier={response?.risk_tier} score={response?.weighted_risk_score} />
              <p className="text-xs text-muted-foreground mt-2">{formatPercentage(response?.confidence)}</p>
            </div>
          </div>

          {/* Natural Occurrence Statement */}
          {response?.natural_occurrence_statement && (
            <div className="p-4 bg-muted/50 border border-border rounded mb-4">
              <p className="text-sm font-semibold text-foreground mb-1">Assessment</p>
              <p className="text-sm text-muted-foreground">{response.natural_occurrence_statement}</p>
              {response.natural_occurrence_probability !== undefined && (
                <p className="text-xs text-muted-foreground mt-2">
                  Natural Occurrence Probability: <span className="monospace">{formatPercentage(response.natural_occurrence_probability)}</span>
                </p>
              )}
            </div>
          )}

          {/* Audit ID */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            <span>Audit ID:</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 monospace hover:text-foreground transition"
              title={auditId}
            >
              <span className="truncate max-w-xs">{auditId}</span>
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Board Replay Tab */}
            {activeTab === 'board' && (
              <div className="space-y-4">
                <ChessboardAnalyzer readOnly squareWidth={40} />
                {response?.explanation && (
                  <div className="mt-6 p-4 bg-muted/50 rounded border border-border">
                    <p className="text-sm font-semibold text-foreground mb-2">Notes</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {response.explanation.map((note: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Centipawn Loss */}
                  <div className="p-4 bg-muted/30 rounded border border-border">
                    <p className="text-sm font-semibold text-foreground mb-2">Centipawn Metrics</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Avg CPL:</span>
                        <span className="monospace">{response?.evidence_report?.centipawn_loss_statistics?.average?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min CPL:</span>
                        <span className="monospace">{response?.evidence_report?.centipawn_loss_statistics?.min?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max CPL:</span>
                        <span className="monospace">{response?.evidence_report?.centipawn_loss_statistics?.max?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="p-4 bg-muted/30 rounded border border-border">
                    <p className="text-sm font-semibold text-foreground mb-2">Performance</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Regan Z:</span>
                        <span className="monospace">{formatZScore(response?.regan_z_score || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IPR Est:</span>
                        <span className="monospace">{(response?.evidence_report?.anomaly_score || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PEP Score:</span>
                        <span className="monospace">{(response?.pep_score || 0).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Metrics */}
                {response?.time_variance_anomaly_score !== null && (
                  <div className="p-4 bg-muted/30 rounded border border-border">
                    <p className="text-sm font-semibold text-foreground mb-3">Time Anomaly</p>
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${Math.min(100, (response?.time_variance_anomaly_score || 0) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Score: <span className="monospace">{(response?.time_variance_anomaly_score || 0).toFixed(3)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Signals Tab */}
            {activeTab === 'signals' && (
              <div className="space-y-3">
                {response?.signals && response.signals.length > 0 ? (
                  response.signals.map((signal: any, i: number) => (
                    <div key={i} className={`p-4 border rounded ${signal.triggered ? 'border-red-500/50 bg-red-500/5' : 'border-border bg-muted/20'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{signal.name}</p>
                          <p className="text-xs text-muted-foreground">{signal.triggered ? 'Triggered' : 'Not triggered'}</p>
                        </div>
                        <div className="text-right">
                          <p className="monospace text-sm font-bold">{signal.score.toFixed(3)}</p>
                          <p className="text-xs text-muted-foreground">Threshold: {signal.threshold.toFixed(3)}</p>
                        </div>
                      </div>
                      {signal.reasons && signal.reasons.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {signal.reasons.map((reason: string, j: number) => (
                            <li key={j} className="flex gap-2">
                              <span>•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No signals detected</p>
                )}
              </div>
            )}

            {/* Evidence Tab */}
            {activeTab === 'evidence' && response?.evidence_report && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded border border-border">
                  <p className="text-sm font-semibold text-foreground mb-2">Conclusion</p>
                  <p className="text-sm text-muted-foreground">{response.evidence_report.conclusion}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded border border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Engine Match</p>
                    <p className="text-2xl font-bold text-foreground">{formatPercentage(response.evidence_report.engine_match_percentage)}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded border border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Maia Agreement</p>
                    <p className="text-2xl font-bold text-foreground">{formatPercentage(response.evidence_report.maia_agreement_percentage || 0)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Behavioral Tab */}
            {activeTab === 'behavioral' && response?.behavioral_metrics && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(response.behavioral_metrics).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-3 bg-muted/30 rounded border border-border">
                    <p className="text-xs text-muted-foreground mb-1 truncate">{key}</p>
                    <p className="font-mono text-sm text-foreground">{typeof value === 'number' ? value.toFixed(2) : value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Report Tab */}
            {activeTab === 'report' && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded border border-border">
                  <p className="text-sm font-semibold text-foreground mb-2">Report Info</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Version: <span className="monospace">{response?.report_version || 1}</span></div>
                    <div>Locked: <span className="monospace">{response?.report_locked ? 'Yes' : 'No'}</span></div>
                    <div>Model: <span className="monospace">{response?.model_version || 'N/A'}</span></div>
                    <div>Feature Schema: <span className="monospace">{response?.feature_schema_version || 'N/A'}</span></div>
                  </div>
                </div>

                {response?.human_explanations && response.human_explanations.length > 0 && (
                  <div className="p-4 bg-muted/30 rounded border border-border">
                    <p className="text-sm font-semibold text-foreground mb-2">Summary</p>
                    <ul className="space-y-2">
                      {response.human_explanations.map((exp: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AnalysisDetail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    }>
      <AnalysisDetailInner />
    </Suspense>
  );
}