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
  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden transform transition-all duration-300 ease-in-out">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {notification.type === 'success' && (
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            )}
            {notification.type === 'error' && (
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            )}
            {notification.type === 'info' && (
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 break-words">
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => onRemove(notification.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};