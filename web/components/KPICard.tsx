import { ReactNode } from 'react';

interface KPICardProps {
  label: string;
  value: string | number | ReactNode;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  className?: string;
  loading?: boolean;
}

export default function KPICard({
  label,
  value,
  icon,
  trend,
  trendValue,
  className = '',
  loading = false,
}: KPICardProps) {
  return (
    <div className={`kpi-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-1">
            {loading ? '—' : value}
          </p>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      {trend && trendValue && (
        <div className={`mt-3 text-sm font-medium ${
          trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-muted-foreground'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </div>
      )}
    </div>
  );
}
