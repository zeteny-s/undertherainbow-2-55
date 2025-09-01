import React from 'react';
import { Notification, NotificationData } from './Notification';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onRemove: (id: string) => void;
  position?: 'bottom-right' | 'top-right';
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ 
  notifications, 
  onRemove, 
  position = 'bottom-right' 
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-2 sm:bottom-4 right-2 sm:right-4 z-50',
    'top-right': 'fixed top-16 sm:top-20 right-2 sm:right-4 z-50'
  };

  return (
    <div className={`${positionClasses[position]} space-y-2 sm:space-y-3 w-[calc(100vw-1rem)] sm:w-80 max-w-[calc(100vw-1rem)]`}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};