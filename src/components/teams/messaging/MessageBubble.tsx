import React from 'react';
import { Message } from '../../../types/messaging';
import { formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn
}) => {
  const getSenderName = () => {
    if (isOwn) return 'Te';
    return message.sender?.name || message.sender?.email || 'Ismeretlen felhasználó';
  };

  const getSenderInitials = () => {
    const name = message.sender?.name || message.sender?.email || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-primary">
            {getSenderInitials()}
          </span>
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
        {!isOwn && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {getSenderName()}
          </span>
        )}
        
        <div
          className={`px-4 py-2 rounded-lg break-words ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <span className="text-xs text-muted-foreground mt-1 px-1">
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true,
            locale: hu
          })}
          {message.is_edited && ' • szerkesztve'}
        </span>
      </div>
    </div>
  );
};