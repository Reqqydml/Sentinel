import type { RiskTier } from './types';
import { formatDistanceToNow } from 'date-fns';

// Risk Tier Constants
export const RISK_COLORS: Record<RiskTier, { bg: string; text: string; label: string }> = {
  LOW: { bg: 'bg-risk-low', text: 'text-risk-low-text', label: 'Low Risk' },
  MODERATE: { bg: 'bg-risk-moderate', text: 'text-risk-moderate-text', label: 'Moderate' },
  ELEVATED: { bg: 'bg-risk-elevated', text: 'text-risk-elevated-text', label: 'Elevated' },
  HIGH_STATISTICAL_ANOMALY: { bg: 'bg-risk-high', text: 'text-risk-high-text', label: 'High Anomaly' },
};

export const RISK_ORDER: Record<RiskTier, number> = {
  LOW: 1,
  MODERATE: 2,
  ELEVATED: 3,
  HIGH_STATISTICAL_ANOMALY: 4,
};

// Formatting Utilities
export function formatRiskTier(tier: RiskTier): string {
  return RISK_COLORS[tier]?.label || tier;
}

export function formatElo(elo: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(elo));
}

export function formatCentipawns(cp: number): string {
  return (cp / 100).toFixed(2);
}

export function formatScore(score: number): string {
  return (score * 100).toFixed(1);
}

export function formatPercentage(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatZScore(z: number): string {
  return z.toFixed(2);
}

export function abbreviatePlayerId(playerId: string, length = 8): string {
  if (playerId.length <= length) return playerId;
  return playerId.slice(0, length) + '...';
}

export function abbreviateGameId(gameId: string, length = 12): string {
  if (gameId.length <= length) return gameId;
  return gameId.slice(0, length) + '...';
}

// Color utilities for charts
export const CHART_COLORS = {
  primary: 'hsl(210, 100%, 50%)',
  accent: 'hsl(188, 100%, 50%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  error: 'hsl(0, 84%, 60%)',
  muted: 'hsl(217, 32%, 26%)',
};

// Chess utilities
export function moveToUCI(from: string, to: string, promotion?: string): string {
  if (promotion) {
    return `${from}${to}${promotion.toLowerCase()}`;
  }
  return `${from}${to}`;
}

export function positionToSquare(row: number, col: number): string {
  return String.fromCharCode(97 + col) + (8 - row);
}

export function squareToPosition(square: string): [number, number] {
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1]);
  return [row, col];
}

// Sorting utilities
export function sortByRiskTier<T extends { risk_tier: RiskTier }>(items: T[]): T[] {
  return [...items].sort((a, b) => RISK_ORDER[b.risk_tier] - RISK_ORDER[a.risk_tier]);
}

export function sortByScore<T extends { weighted_risk_score: number }>(items: T[], desc = true): T[] {
  return [...items].sort((a, b) => {
    const diff = b.weighted_risk_score - a.weighted_risk_score;
    return desc ? diff : -diff;
  });
}

// Classification utilities
export function getRiskSeverity(score: number, tier: RiskTier): 'critical' | 'high' | 'medium' | 'low' {
  if (tier === 'HIGH_STATISTICAL_ANOMALY' && score > 0.8) return 'critical';
  if (tier === 'ELEVATED') return 'high';
  if (tier === 'MODERATE') return 'medium';
  return 'low';
}

// Analytics utilities
export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function calculateMedianScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateStdDev(scores: number[]): number {
  if (scores.length < 2) return 0;
  const avg = calculateAverageScore(scores);
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  return Math.sqrt(variance);
}

// Natural occurrence statement styling
export function getNaturalOccurrenceClass(probability: number): string {
  if (probability > 0.85) return 'text-green-400';
  if (probability > 0.5) return 'text-yellow-400';
  return 'text-red-400';
}

// PGN parsing helper
export function extractHeaderField(pgn: string, field: string): string | null {
  const regex = new RegExp(`\\[${field} "([^"]*)"\\]`, 'i');
  const match = pgn.match(regex);
  return match ? match[1] : null;
}

// Confidence interval utilities
export function formatConfidenceInterval(interval?: [number, number]): string {
  if (!interval) return 'N/A';
  const [lower, upper] = interval;
  return `[${lower.toFixed(3)}, ${upper.toFixed(3)}]`;
}

export function isWithinConfidenceInterval(value: number, interval?: [number, number]): boolean {
  if (!interval) return false;
  const [lower, upper] = interval;
  return value >= lower && value <= upper;
}

// Local storage helpers
export function getLocalStorage(key: string, defaultValue?: any): any {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLocalStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent fail
  }
}

// CSV export utilities
export function toCsvRow(values: any[]): string {
  return values
    .map(v => {
      if (v === null || v === undefined) return '';
      const str = String(v);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

// Deep clone
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (obj instanceof Object) {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}
