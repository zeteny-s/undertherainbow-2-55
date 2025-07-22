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
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'top-right': 'fixed top-20 right-4 z-50'
  };

  return (
    <div className={`${positionClasses[position]} space-y-3 w-80 max-w-[calc(100vw-2rem)]`}>
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