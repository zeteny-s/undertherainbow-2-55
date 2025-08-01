import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../integrations/supabase/client';
import { MessageThread, Message, ThreadParticipant } from '../../../types/messaging';
import { Team, Profile } from '../../../types/teams';
import { MessageThreadList } from './MessageThreadList';
import { MessageConversation } from './MessageConversation';
import { NewMessageModal } from './NewMessageModal';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { useNotifications } from '../../../hooks/useNotifications';
import { MessageSquare, Plus } from 'lucide-react';

interface MessagingSystemProps {
  currentUserId: string;
  isManager: boolean;
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({
  currentUserId,
  isManager
}) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ThreadParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const { addNotification } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
    setupRealtimeSubscriptions();
  }, [currentUserId]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
      fetchParticipants(selectedThread.id);
      markThreadAsRead(selectedThread.id);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchThreads(),
        fetchTeams(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      addNotification('error', 'Hiba történt az adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async () => {
    // Use raw query since messaging tables aren't in generated types yet
    const { data, error } = await supabase.rpc('get_user_threads', {
      user_id: currentUserId
    });

    if (error) {
      console.error('Error fetching threads:', error);
      return;
    }
    
    setThreads((data as any) || []);
  };

  const fetchMessages = async (threadId: string) => {
    // Use raw query since messaging tables aren't in generated types yet
    const { data, error } = await supabase.rpc('get_thread_messages', {
      thread_id: threadId
    });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }
    
    setMessages((data as any) || []);
  };

  const fetchParticipants = async (threadId: string) => {
    // Use raw query since messaging tables aren't in generated types yet
    const { data, error } = await supabase.rpc('get_thread_participants', {
      thread_id: threadId
    });

    if (error) {
      console.error('Error fetching participants:', error);
      return;
    }
    
    setParticipants((data as any) || []);
  };

  const fetchTeams = async () => {
    if (!isManager) return;
    
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    setTeams(data || []);
  };

  const fetchUsers = async () => {
    if (!isManager) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) throw error;
    setUsers(data || []);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (selectedThread && payload.new.thread_id === selectedThread.id) {
            fetchMessages(selectedThread.id);
          }
          fetchThreads(); // Refresh threads to update last_message_at
        }
      )
      .subscribe();

    // Subscribe to thread updates
    const threadsChannel = supabase
      .channel('threads-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads'
        },
        () => {
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(threadsChannel);
    };
  };

  const markThreadAsRead = async (threadId: string) => {
    const { error } = await supabase.rpc('mark_thread_as_read', {
      thread_id: threadId,
      user_id: currentUserId
    });

    if (error) {
      console.error('Error marking thread as read:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedThread) return;

    try {
      const { error } = await supabase.rpc('send_message', {
        content_text: content,
        sender_id: currentUserId,
        thread_id: selectedThread.id
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error sending message:', error);
      addNotification('error', 'Hiba történt az üzenet küldésekor');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-background border border-border rounded-lg overflow-hidden">
      {/* Threads Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Üzenetek
            </h2>
            {isManager && (
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                title="Új üzenet"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <MessageThreadList
            threads={threads}
            selectedThread={selectedThread}
            onSelectThread={setSelectedThread}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <MessageConversation
            thread={selectedThread}
            messages={messages}
            participants={participants}
            currentUserId={currentUserId}
            onSendMessage={sendMessage}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Válassz egy beszélgetést</p>
              <p className="text-sm">Kezdj el beszélgetni a csapattagokkal</p>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <NewMessageModal
          isOpen={showNewMessageModal}
          onClose={() => setShowNewMessageModal(false)}
          teams={teams}
          users={users}
          currentUserId={currentUserId}
          onThreadCreated={(thread) => {
            setSelectedThread(thread);
            fetchThreads();
          }}
        />
      )}
    </div>
  );
};