import React, { useState, useEffect } from 'react';
import { Plus, Users, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Team } from '../../types/teams';
import { CreateTeamModal } from './CreateTeamModal';
import { useNotifications } from '../../hooks/useNotifications';

interface TeamMemberWithProfile {
  id: string;
  user_id: string;
  team_id: string;
  role: 'member' | 'lead';
  joined_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
    profile_type: string | null;
  };
}

export const TeamsList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<{[key: string]: TeamMemberWithProfile[]}>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      setTeams(teamsData || []);

      // Fetch team members for each team
      const membersData: {[key: string]: TeamMemberWithProfile[]} = {};
      for (const team of teamsData || []) {
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select(`
            *,
            profiles (
              name,
              email,
              profile_type
            )
          `)
          .eq('team_id', team.id);

        if (!membersError && members) {
          membersData[team.id] = members as unknown as TeamMemberWithProfile[];
        }
      }
      setTeamMembers(membersData);
    } catch (error) {
      console.error('Error fetching teams:', error);
      addNotification('error', 'Hiba történt a csapatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCreated = () => {
    setShowCreateModal(false);
    fetchTeams();
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a csapatot?')) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      addNotification('success', 'Csapat sikeresen törölve');
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      addNotification('error', 'Hiba történt a csapat törlésekor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Csapatok</h2>
          <p className="text-muted-foreground">Csapatok kezelése és szervezése</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Új Csapat
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Még nincsenek csapatok</h3>
          <p className="text-muted-foreground mb-4">Hozza létre az első csapatot</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Első Csapat Létrehozása
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">{team.name}</h3>
                  {team.description && (
                    <p className="text-muted-foreground text-sm mt-1">{team.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {teamMembers[team.id]?.length || 0} tag
                  </span>
                  <button className="p-1 hover:bg-muted rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {teamMembers[team.id] && teamMembers[team.id].length > 0 && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Csapattagok:</h4>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers[team.id].map((member) => (
                      <div key={member.id} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm">
                        <span className="text-foreground">{member.profiles?.name || member.profiles?.email}</span>
                        <span className="text-muted-foreground">({member.profiles?.profile_type})</span>
                        {member.role === 'lead' && (
                          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">Vezető</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Létrehozva: {new Date(team.created_at).toLocaleDateString('hu-HU')}
                </span>
                <div className="flex items-center gap-2">
                  <button className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                    <Edit className="h-3 w-3" />
                    Szerkesztés
                  </button>
                  <button 
                    onClick={() => deleteTeam(team.id)}
                    className="text-destructive hover:text-destructive/90 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Törlés
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </div>
  );
};