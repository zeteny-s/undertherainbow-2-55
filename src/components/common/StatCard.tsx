import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  change
}) => {
  return (
    <div className="bg-surface-elevated border border-DEFAULT rounded-xl p-4 sm:p-6 transition-all duration-300 hover-lift animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground-muted mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold text-foreground truncate">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${change.isPositive ? 'text-success' : 'text-error'}`}>
              {change.value}
            </p>
          )}
        </div>
        <div className={`${bgColor} p-2.5 sm:p-3 rounded-lg flex-shrink-0 ml-3`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};