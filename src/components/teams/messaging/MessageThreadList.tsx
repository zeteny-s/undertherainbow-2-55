import React from 'react';
import { MessageThread } from '../../../types/messaging';
import { formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Users, User, MessageCircle } from 'lucide-react';

interface MessageThreadListProps {
  threads: MessageThread[];
  selectedThread: MessageThread | null;
  onSelectThread: (thread: MessageThread) => void;
  currentUserId?: string;
}

export const MessageThreadList: React.FC<MessageThreadListProps> = ({
  threads,
  selectedThread,
  onSelectThread,
  currentUserId
}) => {
  const getThreadIcon = (thread: MessageThread) => {
    switch (thread.thread_type) {
      case 'team':
        return <Users className="h-4 w-4" />;
      case 'direct':
        return <User className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getThreadTitle = (thread: MessageThread) => {
    if (thread.title) return thread.title;
    
    switch (thread.thread_type) {
      case 'team':
        return thread.team?.name || 'Csapat beszélgetés';
      case 'direct':
        return thread.created_by_profile?.name || thread.created_by_profile?.email || 'Közvetlen üzenet';
      default:
        return 'Beszélgetés';
    }
  };

  const getThreadSubtitle = (thread: MessageThread) => {
    switch (thread.thread_type) {
      case 'team':
        return 'Csapat beszélgetés';
      case 'direct':
        return 'Közvetlen üzenet';
      default:
        return 'Csoport beszélgetés';
    }
  };

  if (threads.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nincsenek beszélgetések</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelectThread(thread)}
          className={`w-full p-4 text-left hover:bg-accent transition-colors ${
            selectedThread?.id === thread.id ? 'bg-accent' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 text-muted-foreground">
              {getThreadIcon(thread)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-foreground truncate">
                  {getThreadTitle(thread)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(thread.last_message_at), {
                    addSuffix: true,
                    locale: hu
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {getThreadSubtitle(thread)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};