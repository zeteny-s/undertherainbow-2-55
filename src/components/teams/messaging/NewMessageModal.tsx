import React, { useState } from 'react';
import { supabase } from '../../../integrations/supabase/client';
import { Team, Profile } from '../../../types/teams';
import { MessageThread } from '../../../types/messaging';
import { X, Users, User, Search } from 'lucide-react';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  users: Profile[];
  currentUserId: string;
  onThreadCreated: (thread: MessageThread) => void;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  teams,
  users,
  currentUserId,
  onThreadCreated
}) => {
  const [messageType, setMessageType] = useState<'direct' | 'team' | 'group'>('direct');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredUsers = users.filter(user => 
    user.id !== currentUserId && 
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateThread = async () => {
    if (loading) return;
    
    try {
      setLoading(true);

      let threadData: any = {
        created_by: currentUserId,
        thread_type: messageType,
        last_message_at: new Date().toISOString()
      };

      if (messageType === 'team' && selectedTeam) {
        threadData.team_id = selectedTeam;
        const team = teams.find(t => t.id === selectedTeam);
        threadData.title = team?.name;
      } else if (messageType === 'group' && title) {
        threadData.title = title;
      }

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert(threadData)
        .select()
        .single();

      if (threadError) throw threadError;

      // Add participants
      const participantInserts = [];

      // Add creator
      participantInserts.push({
        thread_id: thread.id,
        user_id: currentUserId,
        joined_at: new Date().toISOString()
      });

      if (messageType === 'team' && selectedTeam) {
        // Get team members
        const { data: teamMembers, error: membersError } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', selectedTeam);

        if (membersError) throw membersError;

        teamMembers.forEach(member => {
          if (member.user_id !== currentUserId) {
            participantInserts.push({
              thread_id: thread.id,
              user_id: member.user_id,
              joined_at: new Date().toISOString()
            });
          }
        });
      } else {
        // Add selected users
        selectedUsers.forEach(userId => {
          participantInserts.push({
            thread_id: thread.id,
            user_id: userId,
            joined_at: new Date().toISOString()
          });
        });
      }

      const { error: participantsError } = await supabase
        .from('thread_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      onThreadCreated(thread);
      onClose();
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const canCreate = () => {
    if (messageType === 'team') return selectedTeam;
    if (messageType === 'group') return selectedUsers.length > 0 && title.trim();
    return selectedUsers.length > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Új beszélgetés</h2>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Message Type Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Beszélgetés típusa
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMessageType('direct')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  messageType === 'direct'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <User className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">Közvetlen</span>
              </button>
              <button
                onClick={() => setMessageType('team')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  messageType === 'team'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Users className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">Csapat</span>
              </button>
              <button
                onClick={() => setMessageType('group')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  messageType === 'group'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Users className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">Csoport</span>
              </button>
            </div>
          </div>

          {/* Team Selection */}
          {messageType === 'team' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Csapat kiválasztása
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Válassz csapatot...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Group Title */}
          {messageType === 'group' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Csoport neve
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Adj nevet a csoportnak..."
                className="w-full p-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* User Selection */}
          {(messageType === 'direct' || messageType === 'group') && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Résztvevők
              </label>
              
              <div className="space-y-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Keresés felhasználók között..."
                    className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-border rounded-md">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`w-full p-3 text-left hover:bg-accent transition-colors flex items-center justify-between ${
                        selectedUsers.includes(user.id) ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.profile_type === 'vezetoi' ? 'Vezető' : 'Irodai'}
                          </p>
                        </div>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <div className="w-4 h-4 bg-primary rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
          >
            Mégse
          </button>
          <button
            onClick={handleCreateThread}
            disabled={!canCreate() || loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Létrehozás...' : 'Beszélgetés létrehozása'}
          </button>
        </div>
      </div>
    </div>
  );
};