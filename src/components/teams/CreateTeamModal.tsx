import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Profile } from '../../types/teams';
import { useNotifications } from '../../hooks/useNotifications';

interface CreateTeamModalProps {
  onClose: () => void;
  onTeamCreated: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, onTeamCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamLeadId, setTeamLeadId] = useState<string>('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification('error', 'Hiba történt a felhasználók betöltésekor');
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add team members
      if (selectedMembers.length > 0) {
        const memberInserts = selectedMembers.map(userId => ({
          team_id: teamData.id,
          user_id: userId,
          role: (userId === teamLeadId ? 'lead' : 'member') as 'lead' | 'member'
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      addNotification('success', 'Csapat sikeresen létrehozva');
      onTeamCreated();
    } catch (error) {
      console.error('Error creating team:', error);
      addNotification('error', 'Hiba történt a csapat létrehozásakor');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getProfileTypeLabel = (type: string | null) => {
    switch (type) {
      case 'vezetoi': return 'Vezető';
      case 'irodai': return 'Irodai';
      default: return 'Alkalmazott';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Új Csapat Létrehozása</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Csapat neve *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Csapat neve"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Leírás
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Csapat leírása (opcionális)"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Csapattagok kiválasztása
            </label>
            {fetchingUsers ? (
              <div className="text-muted-foreground">Felhasználók betöltése...</div>
            ) : (
              <div className="border border-border rounded-md max-h-60 overflow-y-auto">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleMember(user.id)}
                        className={`p-1 rounded ${
                          selectedMembers.includes(user.id) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {selectedMembers.includes(user.id) ? 
                          <Minus className="h-4 w-4" /> : 
                          <Plus className="h-4 w-4" />
                        }
                      </button>
                      <div>
                        <div className="font-medium text-foreground">
                          {user.name || user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getProfileTypeLabel(user.profile_type)}
                        </div>
                      </div>
                    </div>
                    {selectedMembers.includes(user.id) && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">Csapatvezető:</label>
                        <input
                          type="radio"
                          name="teamLead"
                          value={user.id}
                          checked={teamLeadId === user.id}
                          onChange={(e) => setTeamLeadId(e.target.value)}
                          className="accent-primary"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Létrehozás...' : 'Csapat Létrehozása'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};