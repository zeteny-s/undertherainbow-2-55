import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Settings, MessageSquare, FolderPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatHistoryModal } from './ChatHistoryModal';
import { StreamingText } from './StreamingText';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ChatConversation {
  id: string;
  title: string;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface ChatFolder {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchConversations(),
        fetchFolders()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    setConversations(data || []);
  };

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('chat_folders')
      .select('*')
      .order('name');

    if (error) throw error;
    setFolders(data || []);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');

    if (error) throw error;
    setMessages(data || []);
  };

  const createConversation = async (title: string) => {
    if (!user?.id) return null;
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        title,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchConversations();
    setActiveConversation(data.id);
    setMessages([]);
    return data.id;
  };

  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user?.id) return;

    let conversationId = activeConversation;
    
    // Create conversation if none exists
    if (!conversationId) {
      const title = inputMessage.length > 50 ? inputMessage.substring(0, 50) + '...' : inputMessage;
      conversationId = await createConversation(title);
      if (!conversationId) return;
    }

    const userMessage = {
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: inputMessage.trim()
    };

    const currentMessage = inputMessage.trim();
    setInputMessage('');
    
    try {
      // Add user message
      const { error: userError } = await supabase
        .from('chat_messages')
        .insert(userMessage);

      if (userError) throw userError;
      
      // Refresh messages to show user message immediately
      if (conversationId) {
        fetchMessages(conversationId);
      }

      // Show typing indicator
      setIsTyping(true);

      // Call AI edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('https://xtovmknldanpipgddsrd.supabase.co/functions/v1/chat-ai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          conversationId
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      await response.json();
      
      // Hide typing indicator
      setIsTyping(false);
      
      // Refresh messages and conversations
      if (conversationId) {
        fetchMessages(conversationId);
        fetchConversations();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Fallback response on error
      const fallbackResponse = {
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: 'Sajnos most nem tudok válaszolni. Kérlek próbáld újra később.'
      };

      await supabase
        .from('chat_messages')
        .insert(fallbackResponse);
        
      if (conversationId) {
        fetchMessages(conversationId);
        fetchConversations();
      }
    }
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    fetchMessages(conversationId);
  };

  const createNewConversation = async () => {
    const newConvId = await createConversation('Új beszélgetés');
    if (newConvId && isMobile) {
      setSidebarOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-80' : 'w-0'
      } transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col ${
        isMobile ? 'fixed inset-y-0 left-0 z-50 shadow-xl' : 'relative'
      }`}>
        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Beszélgetések</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={createNewConversation}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Új beszélgetés"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Mapák kezelése"
                  >
                    <FolderPlus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Folders */}
              {folders.map((folder) => {
                const folderConversations = conversations.filter(c => c.folder_id === folder.id);
                return (
                  <div key={folder.id} className="mb-4">
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: folder.color || '#6b7280' }}
                      />
                      <span>{folder.name}</span>
                      <span className="text-xs text-gray-500">({folderConversations.length})</span>
                    </div>
                    {folderConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => {
                          selectConversation(conversation.id);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-6 py-3 text-sm rounded-lg transition-colors ${
                          activeConversation === conversation.id
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{conversation.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(conversation.last_message_at).toLocaleDateString('hu-HU')}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}

              {/* Ungrouped Conversations */}
              {conversations.filter(c => !c.folder_id).length > 0 && (
                <div>
                  {folders.length > 0 && (
                    <div className="px-3 py-2 text-sm font-medium text-gray-500 border-t border-gray-200 pt-4">
                      Egyéb beszélgetések
                    </div>
                  )}
                  {conversations.filter(c => !c.folder_id).map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        selectConversation(conversation.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-3 text-sm rounded-lg transition-colors ${
                        activeConversation === conversation.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{conversation.title}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(conversation.last_message_at).toLocaleDateString('hu-HU')}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {conversations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Még nincsenek beszélgetések</p>
                  <p className="text-xs mt-1">Kezdj egy új beszélgetést!</p>
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowHistory(true)}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Mapák és beállítások</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with toggle button */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <div className="flex-1">
              {activeConversation ? (
                <h1 className="text-lg font-semibold text-gray-900">
                  {conversations.find(c => c.id === activeConversation)?.title || 'Beszélgetés'}
                </h1>
              ) : (
                <h1 className="text-lg font-semibold text-gray-900">AI Chat Asszisztens</h1>
              )}
            </div>
          </div>
        </div>

        {/* Chat History Modal */}
        <ChatHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          conversations={conversations}
          folders={folders}
          activeConversation={activeConversation}
          onSelectConversation={selectConversation}
          onCreateConversation={createNewConversation}
          onRefreshData={fetchData}
        />

        {activeConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
              {messages.map((message, index) => {
                if (message.role === 'user') {
                  return (
                    <div
                      key={message.id}
                      className="flex justify-end animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="max-w-3xl rounded-2xl p-6 shadow-lg hover-lift transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className="text-xs mt-3 opacity-70 text-blue-100">
                          {new Date(message.created_at).toLocaleTimeString('hu-HU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={message.id} className="flex justify-start animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="max-w-4xl w-full">
                        <StreamingText 
                          text={message.content} 
                          className="text-sm text-gray-800 leading-relaxed"
                        />
                        <p className="text-xs mt-2 text-gray-500">
                          {new Date(message.created_at).toLocaleTimeString('hu-HU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                }
              })}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="max-w-3xl rounded-2xl p-6 bg-white border border-gray-100 shadow-lg">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-6 shadow-lg">
              <div className="flex items-end space-x-4 max-w-4xl mx-auto w-full">
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Írj egy üzenetet az AI-nak..."
                    rows={1}
                    className="w-full resize-none border border-gray-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-gray-50 focus:bg-white transition-colors"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover-lift"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="text-center max-w-2xl animate-fade-in">
              <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Chat Asszisztens
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                Tedd fel kérdéseid, és kezdj beszélgetni az intelligens asszisztenssel. 
                Egyszerűen kezdj el gépelni alul!
              </p>
              
              {/* Quick start input */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="flex items-center space-x-4 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 hover-glow transition-all duration-300">
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Írj egy üzenetet az AI-nak..."
                      rows={1}
                      className="w-full text-lg focus:outline-none placeholder-gray-500 resize-none bg-gray-50 rounded-xl px-4 py-3 border-0"
                      style={{ maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim()}
                    className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover-lift"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="text-base text-gray-500">
                Vagy válassz a korábbi beszélgetések közül az oldalsávban
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};