import type { RiskTier } from '@/lib/types';
import { RISK_COLORS } from '@/lib/utils';

interface RiskBadgeProps {
  tier: RiskTier;
  score?: number;
  className?: string;
  compact?: boolean;
}

export default function RiskBadge({ tier, score, className = '', compact = false }: RiskBadgeProps) {
  const colors = RISK_COLORS[tier];

  return (
    <span className={`badge-risk ${colors.bg} ${colors.text} ${className}`}>
      {compact ? tier.charAt(0) : colors.label}
      {score !== undefined && !compact && (
        <span className="ml-1 opacity-75">
          {(score * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
}
