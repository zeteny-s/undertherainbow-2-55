import React, { useState, useEffect } from 'react';
import { Users, Calendar, UserPlus, Settings, BarChart3, FileText, MessageSquare } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Team } from '../../types/teams';
import { useNotifications } from '../../hooks/useNotifications';
import SettingsLayout from './SettingsLayout';

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

interface TeamDetailsViewProps {
  teamId: string;
}

export const TeamDetailsView: React.FC<TeamDetailsViewProps> = ({ teamId }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  const fetchTeamDetails = async () => {
    try {
      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch team members
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
        .eq('team_id', teamId);

      if (!membersError && members) {
        setTeamMembers(members as unknown as TeamMemberWithProfile[]);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      addNotification('error', 'Hiba történt a csapat adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Csapat nem található</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Áttekintés', icon: BarChart3 },
    { id: 'members', label: 'Tagok', icon: Users },
    { id: 'projects', label: 'Projektek', icon: FileText },
    { id: 'communication', label: 'Kommunikáció', icon: MessageSquare },
    { id: 'settings', label: 'Beállítások', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Összes tag</p>
                    <p className="text-2xl font-bold">{teamMembers.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vezetők</p>
                    <p className="text-2xl font-bold">
                      {teamMembers.filter(m => m.role === 'lead').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Létrehozva</p>
                    <p className="text-2xl font-bold">
                      {new Date(team.created_at).toLocaleDateString('hu-HU')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Csapat leírása</h3>
              <p className="text-muted-foreground">
                {team.description || 'Nincs leírás megadva ehhez a csapathoz.'}
              </p>
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Csapattagok</h3>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Tag hozzáadása
              </button>
            </div>
            <div className="grid gap-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {(member.profiles?.name || member.profiles?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.profiles?.name || member.profiles?.email}</p>
                      <p className="text-sm text-muted-foreground">{member.profiles?.profile_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'lead' && (
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                        Vezető
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Csatlakozott: {new Date(member.joined_at).toLocaleDateString('hu-HU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Projektek</h3>
            <p className="text-muted-foreground">Ez a funkció hamarosan elérhető lesz.</p>
          </div>
        );

      case 'communication':
        return (
          <div className="text-center py-8">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Kommunikáció</h3>
            <p className="text-muted-foreground">Ez a funkció hamarosan elérhető lesz.</p>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Csapat beállítások</h3>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-muted-foreground">Beállítások hamarosan elérhetőek lesznek.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const sidePanelContent = (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="font-medium mb-3">Gyors műveletek</h4>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors text-sm">
            Tag hozzáadása
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors text-sm">
            Csapat szerkesztése
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors text-sm text-destructive">
            Csapat törlése
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="font-medium mb-3">Csapat statisztikák</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Összes tag:</span>
            <span className="font-medium">{teamMembers.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Vezetők:</span>
            <span className="font-medium">{teamMembers.filter(m => m.role === 'lead').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Tagok:</span>
            <span className="font-medium">{teamMembers.filter(m => m.role === 'member').length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <SettingsLayout
      topCardTitle={team.name}
      topCardContent={`${teamMembers.length} tag`}
      bottomCardContent={sidePanelContent}
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </SettingsLayout>
  );
};
