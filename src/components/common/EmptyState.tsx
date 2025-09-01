import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action
}) => {
  return (
    <div className="text-center py-8 sm:py-12 px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-foreground-subtle" />
      </div>
      <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-foreground-muted mb-6 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all duration-200 hover-lift font-medium text-sm sm:text-base mobile-touch-target"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};