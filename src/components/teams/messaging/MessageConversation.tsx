import React, { useState } from 'react';
import { Message, MessageThread, ThreadParticipant } from '../../../types/messaging';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Users, User, MessageCircle, MoreVertical } from 'lucide-react';

interface MessageConversationProps {
  thread: MessageThread;
  messages: Message[];
  participants: ThreadParticipant[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageConversation: React.FC<MessageConversationProps> = ({
  thread,
  messages,
  participants,
  currentUserId,
  onSendMessage,
  messagesEndRef
}) => {
  const [showParticipants, setShowParticipants] = useState(false);

  const getThreadIcon = () => {
    switch (thread.thread_type) {
      case 'team':
        return <Users className="h-5 w-5" />;
      case 'direct':
        return <User className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  const getThreadTitle = () => {
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

  const getParticipantCount = () => {
    return participants.length;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground">
              {getThreadIcon()}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {getThreadTitle()}
              </h2>
              <p className="text-xs text-muted-foreground">
                {getParticipantCount()} résztvevő • Utolsó üzenet{' '}
                {formatDistanceToNow(new Date(thread.last_message_at), {
                  addSuffix: true,
                  locale: hu
                })}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            title="Résztvevők"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Participants List */}
        {showParticipants && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Résztvevők ({getParticipantCount()})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {participant.user?.name?.[0]?.toUpperCase() || 
                       participant.user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">
                    {participant.user?.name || participant.user?.email || 'Ismeretlen felhasználó'}
                  </span>
                  {participant.user_id === currentUserId && (
                    <span className="text-xs text-muted-foreground">(Te)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Még nincsenek üzenetek</p>
            <p className="text-sm">Küldj egy üzenetet a beszélgetés elindításához</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border">
        <MessageInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};