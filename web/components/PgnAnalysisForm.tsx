'use client';

import { useState } from 'react';
import { Upload, Play, AlertCircle } from 'lucide-react';
import { analyzePgn } from '@/lib/api';
import type { AnalyzePgnRequest } from '@/lib/types';

interface PgnAnalysisFormProps {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function PgnAnalysisForm({ onSuccess, onError, className = '' }: PgnAnalysisFormProps) {
  const [pgn, setPgn] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [eventId, setEventId] = useState('');
  const [elo, setElo] = useState('1600');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pgn.trim()) {
      setError('PGN is required');
      return;
    }

    if (!playerId.trim()) {
      setError('Player ID is required');
      return;
    }

    if (!eventId.trim()) {
      setError('Event ID is required');
      return;
    }

    setLoading(true);
    try {
      const request: AnalyzePgnRequest = {
        player_id: playerId,
        event_id: eventId,
        official_elo: parseInt(elo),
        player_color: playerColor,
        pgn_text: pgn,
      };

      const result = await analyzePgn(request);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Player ID</label>
          <input
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="e.g., player_123"
            className="input w-full"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Event ID</label>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="e.g., event_456"
            className="input w-full"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Rating (ELO)</label>
          <input
            type="number"
            value={elo}
            onChange={(e) => setElo(e.target.value)}
            placeholder="1600"
            className="input w-full"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Player Color</label>
          <select
            value={playerColor}
            onChange={(e) => setPlayerColor(e.target.value as 'white' | 'black')}
            className="input w-full"
            disabled={loading}
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">PGN</label>
        <textarea
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder="[Event "?"][Date "?"]
          
1. e4 c5 2. Nf3 d6..."
          className="input w-full h-48 resize-none p-3 font-mono text-xs"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded flex items-start gap-2 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
      >
        {loading ? (
          <>
            <span className="animate-spin">⟳</span>
            Analyzing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Analyze Game
          </>
        )}
      </button>
    </form>
  );
}
