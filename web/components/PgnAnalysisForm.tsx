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
        player_id: playerId.trim(),
        event_id: eventId.trim(),
        official_elo: parseInt(elo) || 1600,
        player_color: playerColor,
        pgn_text: pgn.trim(),
        event_type: 'online',
      };

      const result = await analyzePgn(request);
      setPgn('');
      setPlayerId('');
      setEventId('');
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPgn(content);
    };
    reader.readAsText(file);
  };

  return (
    <form onSubmit={handleSubmit} className={`card p-6 space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          PGN Text or Upload
        </label>
        <textarea
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder="Paste PGN here or upload a file..."
          className="w-full h-32 bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <div className="mt-2 flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm cursor-pointer hover:opacity-90 transition">
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
            <input
              type="file"
              accept=".pgn,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <span className="text-xs text-muted-foreground">.pgn or .txt file</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">
            Player ID
          </label>
          <input
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="username"
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">
            Event ID
          </label>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="tournament-2024"
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">
            Rating (Elo)
          </label>
          <input
            type="number"
            value={elo}
            onChange={(e) => setElo(e.target.value)}
            min="100"
            max="3000"
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">
            Player Color
          </label>
          <select
            value={playerColor}
            onChange={(e) => setPlayerColor(e.target.value as 'white' | 'black')}
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        <Play className="w-4 h-4" />
        {loading ? 'Analyzing...' : 'Analyze Game'}
      </button>
    </form>
  );
}
