import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageCircle, FolderOpen, MoreVertical, Search, History } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user?.id) return;

    let conversationId = activeConversation;
    
    // Create conversation if none exists
    if (!conversationId) {
      conversationId = await createConversation(inputMessage.substring(0, 50) + '...');
      if (!conversationId) return;
    }

    const userMessage = {
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: inputMessage.trim()
    };

    try {
      // Add user message
      const { error: userError } = await supabase
        .from('chat_messages')
        .insert(userMessage);

      if (userError) throw userError;

      // Simulate AI response (replace with actual AI integration)
      const aiResponse = {
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: `Ez egy minta válasz a következő üzenetre: "${inputMessage}". A valódi AI integrációt később implementáljuk.`
      };

      setTimeout(async () => {
        const { error: aiError } = await supabase
          .from('chat_messages')
          .insert(aiResponse);

        if (!aiError && conversationId) {
          // Update conversation timestamp
          await supabase
            .from('chat_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);

          fetchMessages(conversationId);
          fetchConversations();
        }
      }, 1000);

      setInputMessage('');
      if (conversationId) {
        fetchMessages(conversationId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    fetchMessages(conversationId);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedConversations = folders.reduce((acc, folder) => {
    acc[folder.id] = filteredConversations.filter(conv => conv.folder_id === folder.id);
    return acc;
  }, {} as Record<string, ChatConversation[]>);

  const ungroupedConversations = filteredConversations.filter(conv => !conv.folder_id);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Ma';
    } else if (diffDays === 2) {
      return 'Tegnap';
    } else if (diffDays <= 7) {
      return `${diffDays} napja`;
    } else {
      return date.toLocaleDateString('hu-HU');
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        showHistory ? 'w-80' : 'w-16'
      }`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <History className="w-5 h-5 text-gray-600" />
            </button>
            
            {showHistory && (
              <button
                onClick={() => createConversation('Új beszélgetés')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {showHistory && (
            <div className="mt-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Keresés a beszélgetésekben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Conversation List */}
        {showHistory && (
          <div className="flex-1 overflow-y-auto">
            {/* Folders */}
            {folders.map((folder) => {
              const folderConversations = groupedConversations[folder.id] || [];
              if (folderConversations.length === 0) return null;

              return (
                <div key={folder.id} className="p-2">
                  <div className="flex items-center space-x-2 p-2 text-sm font-medium text-gray-600">
                    <FolderOpen className="w-4 h-4" style={{ color: folder.color || '#6b7280' }} />
                    <span>{folder.name}</span>
                  </div>
                  
                  {folderConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        activeConversation === conv.id
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(conv.last_message_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}

            {/* Ungrouped conversations */}
            {ungroupedConversations.length > 0 && (
              <div className="p-2">
                {ungroupedConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                      activeConversation === conv.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(conv.last_message_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {filteredConversations.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                Még nincsenek beszélgetések
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {conversations.find(c => c.id === activeConversation)?.title || 'Beszélgetés'}
                  </h2>
                  <p className="text-sm text-gray-500">AI Asszisztens</p>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${(message.role === 'user') ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3xl rounded-lg p-4 ${
                    (message.role === 'user')
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      (message.role === 'user') ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString('hu-HU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-3">
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
                    placeholder="Írj egy üzenetet..."
                    rows={1}
                    className="w-full resize-none border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Üdvözöl az AI Chat
              </h2>
              <p className="text-gray-600 mb-6">
                Válassz egy korábbi beszélgetést, vagy kezdj egy újat az AI asszisztenssel.
              </p>
              <button
                onClick={() => createConversation('Új beszélgetés')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Új beszélgetés kezdése</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};