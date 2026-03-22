'use client';

import { useState, useCallback, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
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

  // Load PGN or initial FEN
  useMemo(() => {
    chess.reset();
    if (pgn) {
      chess.loadPgn(pgn);
      const history = chess.moves({ verbose: true }).map(m => m.san);
      setMoveHistory(history);
    } else if (initialFen) {
      chess.load(initialFen);
    }
    chess.reset();
    setCurrentMoveIndex(-1);
  }, [pgn, initialFen, chess]);

  const currentFen = useMemo(() => {
    const tempChess = new Chess();
    if (pgn) tempChess.loadPgn(pgn);
    else if (initialFen) tempChess.load(initialFen);
    else return tempChess.fen();

    for (let i = 0; i <= currentMoveIndex; i++) {
      if (i < moveHistory.length) {
        tempChess.move(moveHistory[i]);
      }
    }
    return tempChess.fen();
  }, [pgn, initialFen, moveHistory, currentMoveIndex]);

  const handleMakeMove = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (readOnly) return false;
      const tempChess = new Chess(currentFen);
      const move = tempChess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      if (move) {
        onMoveSelect?.(move.san);
        return true;
      }
      return false;
    },
    [currentFen, readOnly, onMoveSelect]
  );

  const goToMove = (index: number) => {
    const newIndex = Math.max(-1, Math.min(index, moveHistory.length - 1));
    setCurrentMoveIndex(newIndex);
  };

  const boardSize = (squareWidth * 8);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex justify-center">
        <div style={{ width: boardSize, height: boardSize }} className="border border-border rounded-lg overflow-hidden">
          <Chessboard
            position={currentFen}
            onPieceDrop={handleMakeMove}
            boardWidth={boardSize}
            showBoardNotation={showCoordinates}
            arePiecesDraggable={!readOnly}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            customSquareStyles={{
              // Highlight last move
              ...(() => {
                if (currentMoveIndex >= 0 && moveHistory[currentMoveIndex]) {
                  const tempChess = new Chess();
                  if (pgn) tempChess.loadPgn(pgn);
                  for (let i = 0; i < currentMoveIndex; i++) {
                    tempChess.move(moveHistory[i]);
                  }
                  const moves = tempChess.moves({ verbose: true });
                  const moveObj = moves.find(m => m.san === moveHistory[currentMoveIndex]);
                  if (moveObj) {
                    return {
                      [moveObj.from]: { backgroundColor: 'rgba(255, 193, 7, 0.4)' },
                      [moveObj.to]: { backgroundColor: 'rgba(255, 193, 7, 0.4)' },
                    };
                  }
                }
                return {};
              })(),
            }}
          />
        </div>
      </div>

      {moveHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => goToMove(-1)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Start position"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToMove(currentMoveIndex - 1)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Previous move"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToMove(currentMoveIndex + 1)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Next move"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground mb-2">
              Move {currentMoveIndex + 1} / {moveHistory.length}
            </p>
            <div className="flex flex-wrap gap-1">
              {moveHistory.map((move, idx) => (
                <button
                  key={idx}
                  onClick={() => goToMove(idx)}
                  className={`px-2 py-1 rounded text-xs font-mono transition ${
                    idx === currentMoveIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
