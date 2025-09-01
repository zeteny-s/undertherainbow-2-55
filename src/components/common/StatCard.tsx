import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  className = ''
}) => {
  return (
    <div className={`glass-card hover-lift rounded-2xl p-4 sm:p-6 transition-all duration-300 animate-fade-in ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-primary shadow-glass">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        {change && (
          <span className={`mobile-text-xs sm:text-sm font-semibold ${
            change.isPositive ? 'text-success' : 'text-error'
          }`}>
            {change.value}
          </span>
        )}
      </div>
      
      <div className="space-y-1 sm:space-y-2">
        <p className="mobile-text-xs sm:text-sm font-medium text-foreground-muted">
          {title}
        </p>
        <p className="heading-2 bg-gradient-primary bg-clip-text text-transparent font-bold">
          {value}
        </p>
      </div>
    </div>
  );
};