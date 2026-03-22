'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PgnAnalysisForm from '@/components/PgnAnalysisForm';
import ChessboardAnalyzer from '@/components/Chessboard';
import RiskBadge from '@/components/RiskBadge';
import type { AnalyzeResponse } from '@/lib/types';
import { formatPercentage, formatZScore } from '@/lib/utils';

export default function DemoMode() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pgn, setPgn] = useState<string | undefined>();
  const router = useRouter();

  const handleSuccess = (analysisResult: AnalyzeResponse) => {
    setResult(analysisResult);
    // Note: In a real app, we'd pass the PGN to the chessboard
    setLoading(false);
  };

  const handleError = (error: Error) => {
    setLoading(false);
    console.error(error);
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-foreground">Demo Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Upload a PGN file to see how Sentinel analyzes game integrity
          </p>
        </div>

        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PgnAnalysisForm
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>

            <div className="lg:col-span-2">
              <div className="card p-6 h-full flex flex-col justify-center items-center text-center">
                <div className="space-y-4">
                  <div className="text-6xl">♞</div>
                  <h2 className="text-xl font-semibold text-foreground">Upload a PGN to begin</h2>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Sentinel will analyze the game for statistical anomalies, engine agreement, timing patterns, and behavioral indicators.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-sm mx-auto">
                    <li className="flex gap-2"><span>•</span><span>Move accuracy analysis</span></li>
                    <li className="flex gap-2"><span>•</span><span>Timing pattern detection</span></li>
                    <li className="flex gap-2"><span>•</span><span>Engine match percentage</span></li>
                    <li className="flex gap-2"><span>•</span><span>Performance anomaly scoring</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar with Results */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-6">
                <div className="text-center mb-4">
                  <RiskBadge tier={result.risk_tier} score={result.weighted_risk_score} />
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatPercentage(result.confidence)} confidence
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Regan Z-Score</p>
                    <p className="monospace font-bold text-foreground">{formatZScore(result.regan_z_score || 0)}</p>
                  </div>

                  <div className="p-3 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Analyzed Moves</p>
                    <p className="monospace font-bold text-foreground">{result.analyzed_move_count}</p>
                  </div>

                  <div className="p-3 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Triggered Signals</p>
                    <p className="monospace font-bold text-foreground">{result.triggered_signals}</p>
                  </div>

                  {result.natural_occurrence_probability !== undefined && (
                    <div className="p-3 bg-muted/30 rounded border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Natural Occurrence</p>
                      <p className="text-sm font-bold text-foreground">
                        {formatPercentage(result.natural_occurrence_probability)}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setResult(null)}
                  className="w-full mt-4 py-2 px-3 bg-secondary text-secondary-foreground rounded text-sm font-medium hover:opacity-90 transition"
                >
                  Analyze Another Game
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Natural Occurrence Statement */}
              {result.natural_occurrence_statement && (
                <div className="card p-6 border border-border">
                  <h2 className="font-semibold text-foreground mb-3">Assessment</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.natural_occurrence_statement}
                  </p>
                </div>
              )}

              {/* Chessboard */}
              <div className="card p-6">
                <h2 className="font-semibold text-foreground mb-4">Board Replay</h2>
                <ChessboardAnalyzer
                  readOnly
                  squareWidth={35}
                />
              </div>

              {/* Key Findings */}
              {result.signals && result.signals.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-foreground mb-4">Signal Triggers ({result.signals.filter(s => s.triggered).length})</h2>
                  <div className="space-y-2">
                    {result.signals.filter(s => s.triggered).slice(0, 5).map((signal, i) => (
                      <div key={i} className="p-3 bg-red-500/5 border border-red-500/30 rounded text-sm">
                        <p className="font-semibold text-foreground">{signal.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Score: <span className="monospace">{signal.score.toFixed(3)}</span> / Threshold: <span className="monospace">{signal.threshold.toFixed(3)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanations */}
              {result.human_explanations && result.human_explanations.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-foreground mb-4">Analysis Summary</h2>
                  <ul className="space-y-2">
                    {result.human_explanations.map((exp, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-3">
                        <span className="text-primary">•</span>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
