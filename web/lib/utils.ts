import type { RiskTier } from './types';
import { formatDistanceToNow } from 'date-fns';

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
