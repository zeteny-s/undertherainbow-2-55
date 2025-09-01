import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Betöltés...' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6 sm:h-8 sm:w-8',
    lg: 'h-8 w-8 sm:h-12 sm:w-12'
  };

  const textSizeClasses = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg'
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-primary`} />
      <span className={`${textSizeClasses[size]} text-foreground-muted font-medium`}>{text}</span>
    </div>
  );
};