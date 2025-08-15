import React, { useState, useEffect } from 'react';
import { Plus, Users, MoreVertical, Edit, Trash2, Search, Filter } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Team } from '../../types/teams';
import { CreateTeamModal } from './CreateTeamModal';
import { useNotifications } from '../../hooks/useNotifications';
import CrudLayout from './CrudLayout';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
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

  // Filter teams based on search and filter
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterRole === 'all') return matchesSearch;
    
    const teamMembersList = teamMembers[team.id] || [];
    if (filterRole === 'lead') {
      return matchesSearch && teamMembersList.some(member => member.role === 'lead');
    }
    if (filterRole === 'member') {
      return matchesSearch && teamMembersList.some(member => member.role === 'member');
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  return (
    <CrudLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Csapatok</h2>
            <p className="text-muted-foreground">Csapatok kezelése és szervezése</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Új Csapat
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Keresés csapatok között..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Minden szerep</option>
            <option value="lead">Csak vezetők</option>
            <option value="member">Csak tagok</option>
          </select>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {searchTerm || filterRole !== 'all' ? 'Nincs találat' : 'Még nincsenek csapatok'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterRole !== 'all' 
                ? 'Próbálja meg módosítani a keresési feltételeket' 
                : 'Hozza létre az első csapatot'
              }
            </p>
            {!searchTerm && filterRole === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Első Csapat Létrehozása
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <div key={team.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{team.name}</h3>
                    {team.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed">{team.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                      <Users className="h-4 w-4" />
                      {teamMembers[team.id]?.length || 0}
                    </span>
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {teamMembers[team.id] && teamMembers[team.id].length > 0 && (
                  <div className="border-t border-border pt-4 mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">Csapattagok:</h4>
                    <div className="flex flex-wrap gap-2">
                      {teamMembers[team.id].slice(0, 3).map((member) => (
                        <div key={member.id} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md text-sm">
                          <span className="text-foreground font-medium">{member.profiles?.name || member.profiles?.email}</span>
                          <span className="text-muted-foreground text-xs">({member.profiles?.profile_type})</span>
                          {member.role === 'lead' && (
                            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium">Vezető</span>
                          )}
                        </div>
                      ))}
                      {teamMembers[team.id].length > 3 && (
                        <span className="text-muted-foreground text-xs px-2 py-1.5">
                          +{teamMembers[team.id].length - 3} további
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Létrehozva: {new Date(team.created_at).toLocaleDateString('hu-HU')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors">
                      <Edit className="h-3 w-3" />
                      Szerkesztés
                    </button>
                    <button 
                      onClick={() => deleteTeam(team.id)}
                      className="text-destructive hover:text-destructive/90 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
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
    </CrudLayout>
  );
};