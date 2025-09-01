import React from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationProps {
  notification: NotificationData;
  onRemove: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onRemove }) => {
  const iconBgColors = {
    success: 'bg-success/10',
    error: 'bg-error/10', 
    info: 'bg-primary/10'
  };

  const iconColors = {
    success: 'text-success',
    error: 'text-error',
    info: 'text-primary'
  };

  return (
    <div className="bg-surface-elevated shadow-lg rounded-lg border border-DEFAULT overflow-hidden transform transition-all duration-300 ease-in-out animate-slide-in-right">
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {notification.type === 'success' && (
              <div className={`w-5 h-5 sm:w-6 sm:h-6 ${iconBgColors.success} rounded-full flex items-center justify-center`}>
                <Check className={`h-3 w-3 sm:h-4 sm:w-4 ${iconColors.success}`} />
              </div>
            )}
            {notification.type === 'error' && (
              <div className={`w-5 h-5 sm:w-6 sm:h-6 ${iconBgColors.error} rounded-full flex items-center justify-center`}>
                <AlertCircle className={`h-3 w-3 sm:h-4 sm:w-4 ${iconColors.error}`} />
              </div>
            )}
            {notification.type === 'info' && (
              <div className={`w-5 h-5 sm:w-6 sm:h-6 ${iconBgColors.info} rounded-full flex items-center justify-center`}>
                <AlertCircle className={`h-3 w-3 sm:h-4 sm:w-4 ${iconColors.info}`} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-foreground break-words leading-relaxed">
              {notification.message}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              className="text-foreground-subtle hover:text-foreground transition-colors p-1 mobile-touch-target"
              onClick={() => onRemove(notification.id)}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};