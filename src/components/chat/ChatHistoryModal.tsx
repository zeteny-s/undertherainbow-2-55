import React, { useState } from 'react';
import { X, Search, Plus, FolderOpen, MoreVertical, Trash2, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

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

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  folders: ChatFolder[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onRefreshData: () => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  conversations,
  folders,
  activeConversation,
  onSelectConversation,
  onCreateConversation,
  onRefreshData
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6b7280');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [draggedConversation, setDraggedConversation] = useState<string | null>(null);

  const colorOptions = [
    '#6b7280', '#ef4444', '#f59e0b', '#10b981', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'
  ];

  if (!isOpen) return null;

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

  const createFolder = async () => {
    if (!user?.id || !newFolderName.trim()) return;

    try {
      await supabase
        .from('chat_folders')
        .insert({
          name: newFolderName.trim(),
          color: selectedColor,
          user_id: user.id
        });

      setNewFolderName('');
      setSelectedColor('#6b7280');
      setShowFolderForm(false);
      onRefreshData();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Biztosan törlöd ezt a mappát? A benne lévő beszélgetések nem törlődnek.')) return;

    try {
      await supabase
        .from('chat_folders')
        .delete()
        .eq('id', folderId);

      onRefreshData();
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Biztosan törlöd ezt a beszélgetést?')) return;

    try {
      // Delete messages first
      await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete conversation
      await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      onRefreshData();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const moveToFolder = async (conversationId: string, folderId: string | null) => {
    try {
      await supabase
        .from('chat_conversations')
        .update({ folder_id: folderId })
        .eq('id', conversationId);

      onRefreshData();
    } catch (error) {
      console.error('Error moving conversation:', error);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };

  const handleDragStart = (conversationId: string) => {
    setDraggedConversation(conversationId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    if (draggedConversation) {
      moveToFolder(draggedConversation, folderId);
      setDraggedConversation(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Conversations</h2>
              <p className="text-gray-600 mt-1">Válassz egy korábbi beszélgetést vagy hozz létre újat</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Search and actions */}
          <div className="mt-4 flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Keresés a beszélgetésekben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
              />
            </div>
            <button
              onClick={onCreateConversation}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Új chat
            </button>
            <button
              onClick={() => setShowFolderForm(!showFolderForm)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              <Folder className="w-4 h-4 inline mr-2" />
              Új mappa
            </button>
          </div>

          {/* New folder form */}
          {showFolderForm && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Mappa neve..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-lg border-2 ${
                        selectedColor === color ? 'border-gray-800' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Létrehozás
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Folders - Always show them for drag & drop */}
          {folders.map((folder) => {
            const folderConversations = groupedConversations[folder.id] || [];
            
            return (
              <div key={folder.id} className="mb-6">
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed border-transparent hover:border-gray-300"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div className="flex items-center space-x-3">
                    {collapsedFolders.has(folder.id) ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                    <FolderOpen className="w-5 h-5" style={{ color: folder.color || '#6b7280' }} />
                    <span className="font-medium text-gray-900">{folder.name}</span>
                    <span className="text-xs text-gray-500">({folderConversations.length})</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder(folder.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                {!collapsedFolders.has(folder.id) && folderConversations.length > 0 && (
                  <div className="space-y-1 pl-4">
                    {folderConversations.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={activeConversation === conv.id}
                        onSelect={() => {
                          onSelectConversation(conv.id);
                          onClose();
                        }}
                        onDelete={() => deleteConversation(conv.id)}
                        onMoveToFolder={(folderId) => moveToFolder(conv.id, folderId)}
                        folders={folders}
                        formatTime={formatTime}
                        onDragStart={() => handleDragStart(conv.id)}
                        isDragging={draggedConversation === conv.id}
                      />
                    ))}
                  </div>
                )}
                
                {!collapsedFolders.has(folder.id) && folderConversations.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm italic ml-4">
                    Húzd ide a beszélgetéseket
                  </div>
                )}
              </div>
            );
          })}

          {/* Ungrouped conversations */}
          {ungroupedConversations.length > 0 && (
            <div className="mb-6">
              <div 
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, null)}
              >
                <span className="font-medium text-gray-900">Nem csoportosított</span>
                <span className="text-xs text-gray-500">({ungroupedConversations.length})</span>
              </div>
              
              <div className="space-y-1 pl-4">
                {ungroupedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversation === conv.id}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    onDelete={() => deleteConversation(conv.id)}
                    onMoveToFolder={(folderId) => moveToFolder(conv.id, folderId)}
                    folders={folders}
                    formatTime={formatTime}
                    onDragStart={() => handleDragStart(conv.id)}
                    isDragging={draggedConversation === conv.id}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredConversations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">Nincs beszélgetés</div>
              <p className="text-gray-500">Kezdj egy új beszélgetést az AI-val!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveToFolder: (folderId: string | null) => void;
  folders: ChatFolder[];
  formatTime: (dateString: string) => string;
  onDragStart: () => void;
  isDragging: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onMoveToFolder,
  folders,
  formatTime,
  onDragStart,
  isDragging
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onSelect}
        draggable
        onDragStart={onDragStart}
        className={`w-full text-left p-4 rounded-xl mb-1 transition-all duration-200 ${
          isDragging ? 'opacity-50' : ''
        } ${
          isActive
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 shadow-sm'
            : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {conversation.title}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatTime(conversation.last_message_at)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors ml-2"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </button>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[110] min-w-48 animate-scale-in">
          <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100">Áthelyezés mappába</div>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                onMoveToFolder(folder.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2"
            >
              <FolderOpen className="w-4 h-4" style={{ color: folder.color || '#6b7280' }} />
              <span>{folder.name}</span>
            </button>
          ))}
          <button
            onClick={() => {
              onMoveToFolder(null);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
          >
            📂 Nincs mappa
          </button>
          <div className="border-t border-gray-100 mt-1">
            <button
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Törlés</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};