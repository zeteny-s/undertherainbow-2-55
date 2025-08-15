import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, UserPlus, BarChart3, Filter } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Team } from '../../types/teams';
import { useNotifications } from '../../hooks/useNotifications';
import DashboardLayout from './DashboardLayout';
import { TeamsList } from './TeamsList';
import { CreateTeamModal } from './CreateTeamModal';

interface TeamStats {
  totalTeams: number;
  totalMembers: number;
  activeTeams: number;
  newTeamsThisMonth: number;
}

export const TeamsDashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalTeams: 0,
    totalMembers: 0,
    activeTeams: 0,
    newTeamsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchTeamsData();
  }, []);

  const fetchTeamsData = async () => {
    try {
      setLoading(true);
      
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      setTeams(teamsData || []);

      // Fetch team members for statistics
      let totalMembers = 0;
      let activeTeams = 0;
      let newTeamsThisMonth = 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      for (const team of teamsData || []) {
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', team.id);

        if (!membersError && members) {
          totalMembers += members.length;
          if (members.length > 0) {
            activeTeams++;
          }
        }

        // Check if team was created this month
        const teamCreatedDate = new Date(team.created_at);
        if (teamCreatedDate.getMonth() === currentMonth && teamCreatedDate.getFullYear() === currentYear) {
          newTeamsThisMonth++;
        }
      }

      setTeamStats({
        totalTeams: teamsData?.length || 0,
        totalMembers,
        activeTeams,
        newTeamsThisMonth,
      });

    } catch (error) {
      console.error('Error fetching teams data:', error);
      addNotification('error', 'Hiba történt az adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCreated = () => {
    setShowCreateModal(false);
    fetchTeamsData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Betöltés...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Csapatok Kezelése</h1>
            <p className="text-muted-foreground">Csapatok áttekintése és szervezése</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'dashboard'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <UserPlus className="h-5 w-5" />
              Új Csapat
            </button>
          </div>
        </div>

        {viewMode === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Összes csapat</p>
                    <p className="text-2xl font-bold text-foreground">{teamStats.totalTeams}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Összes tag</p>
                    <p className="text-2xl font-bold text-foreground">{teamStats.totalMembers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aktív csapatok</p>
                    <p className="text-2xl font-bold text-foreground">{teamStats.activeTeams}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Új ebben a hónapban</p>
                    <p className="text-2xl font-bold text-foreground">{teamStats.newTeamsThisMonth}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Teams */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Legutóbbi csapatok</h2>
                <button
                  onClick={() => setViewMode('list')}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Összes megtekintése →
                </button>
              </div>
              
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Még nincsenek csapatok</h3>
                  <p className="text-muted-foreground mb-4">Hozza létre az első csapatot</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Első Csapat Létrehozása
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {teams.slice(0, 6).map((team) => (
                    <div key={team.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-foreground">{team.name}</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {new Date(team.created_at).toLocaleDateString('hu-HU')}
                        </span>
                      </div>
                      {team.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <TeamsList />
        )}

        {showCreateModal && (
          <CreateTeamModal
            onClose={() => setShowCreateModal(false)}
            onTeamCreated={handleTeamCreated}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
