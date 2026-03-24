'use client';

import { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ChessboardAnalyzerProps {
  pgn?: string;
  initialFen?: string;
  onMoveSelect?: (move: string) => void;
  readOnly?: boolean;
  showCoordinates?: boolean;
  squareWidth?: number;
  height?: string;
  className?: string;
}

export default function ChessboardAnalyzer({
  pgn,
  initialFen,
  onMoveSelect,
  readOnly = true,
  showCoordinates = true,
  squareWidth = 50,
  height = 'h-96',
  className = '',
}: ChessboardAnalyzerProps) {
  const chess = useMemo(() => new Chess(), []);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [fen, setFen] = useState<string>(initialFen || chess.fen());

  const loadPgn = useCallback(() => {
    if (!pgn) return;
    try {
      chess.reset();
      chess.loadPgn(pgn);
      const moves = [];
      const tempChess = new Chess();
      tempChess.loadPgn(pgn);
      let move;
      while ((move = tempChess.moves({ verbose: true })[0])) {
        moves.push(tempChess.move(move).san);
      }
      setMoveHistory(moves);
      setCurrentMoveIndex(-1);
      setFen(chess.fen());
    } catch (e) {
      console.error('Failed to load PGN:', e);
    }
  }, [pgn, chess]);

  useState(() => {
    if (pgn) loadPgn();
  });

  const goToMove = (index: number) => {
    if (index < -1 || index >= moveHistory.length) return;
    
    chess.reset();
    for (let i = 0; i <= index; i++) {
      if (i < moveHistory.length) {
        chess.move(moveHistory[i]);
      }
    }
    
    setCurrentMoveIndex(index);
    setFen(chess.fen());
    if (index >= 0) {
      onMoveSelect?.(moveHistory[index]);
    }
  };

  const nextMove = () => {
    goToMove(currentMoveIndex + 1);
  };

  const prevMove = () => {
    goToMove(currentMoveIndex - 1);
  };

  const reset = () => {
    goToMove(-1);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`bg-slate-700 border-4 border-slate-900 rounded flex items-center justify-center ${height}`}>
        <div className="text-center text-white space-y-2">
          <p className="text-2xl font-bold">♟ Chessboard</p>
          <p className="text-sm opacity-75">
            {fen ? `FEN: ${fen.split(' ')[0].substring(0, 30)}...` : 'Position: Initial'}
          </p>
          {moveHistory.length > 0 && (
            <p className="text-sm opacity-75">
              Move {currentMoveIndex + 1} of {moveHistory.length}
            </p>
          )}
        </div>
      </div>

      {moveHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground rounded text-sm flex items-center gap-1 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={prevMove}
              disabled={currentMoveIndex <= -1}
              className="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground rounded text-sm flex items-center gap-1 disabled:opacity-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={nextMove}
              disabled={currentMoveIndex >= moveHistory.length - 1}
              className="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground rounded text-sm flex items-center gap-1 disabled:opacity-50 transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Moves</h3>
            <div className="flex flex-wrap gap-2 bg-muted/30 p-3 rounded">
              {moveHistory.map((move, idx) => (
                <button
                  key={idx}
                  onClick={() => goToMove(idx)}
                  className={`px-3 py-1 rounded text-sm font-mono transition ${
                    currentMoveIndex === idx
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {idx + 1}. {move}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
