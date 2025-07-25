import React, { useState, useEffect } from 'react';
import { Plus, Users, UserPlus, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../common/NotificationContainer';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Team, TeamMember, Task, Profile } from '../../types/teams';
import { TeamModal } from './TeamModal';
import { TaskModal } from './TaskModal';
import { TeamCard } from './TeamCard';
import { UserCard } from './UserCard';

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [draggedUser, setDraggedUser] = useState<Profile | null>(null);
  const { notifications, addNotification, removeNotification } = useNotifications();

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Felhasználó';
    
    if (hour >= 4 && hour < 10) {
      return `Jó Reggelt, ${userName}!`;
    } else if (hour >= 10 && hour < 18) {
      return `Szia, ${userName}!`;
    } else if (hour >= 18 && hour < 21) {
      return `Jó estét, ${userName}!`;
    } else {
      return `Jó éjszakát, ${userName}!`;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTeams(),
        fetchAllUsers(),
        fetchTeamMembers(),
        fetchTasks()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      addNotification('error', 'Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    setTeams((data || []) as Team[]);
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) throw error;
    setAllUsers((data || []) as Profile[]);
  };

  const fetchTeamMembers = async () => {
    // Simplified query without join for now
    const { data, error } = await supabase
      .from('team_members')
      .select('*');

    if (error) throw error;
    setTeamMembers((data || []) as TeamMember[]);
  };

  const fetchTasks = async () => {
    // Simplified query without join for now
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setTasks((data || []) as Task[]);
  };

  const handleCreateTeam = async (teamData: { name: string; description?: string }) => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('teams')
        .insert([
          {
            name: teamData.name,
            description: teamData.description,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => [...prev, data as Team]);
      addNotification('success', 'Csapat sikeresen létrehozva');
      setShowTeamModal(false);
    } catch (error) {
      console.error('Error creating team:', error);
      addNotification('error', 'Hiba a csapat létrehozása során');
    }
  };

  const handleUpdateTeam = async (teamId: string, teamData: { name: string; description?: string }) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(teamData)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => prev.map(team => team.id === teamId ? data as Team : team));
      addNotification('success', 'Csapat sikeresen frissítve');
      setShowTeamModal(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Error updating team:', error);
      addNotification('error', 'Hiba a csapat frissítése során');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      setTeams(prev => prev.filter(team => team.id !== teamId));
      addNotification('success', 'Csapat sikeresen törölve');
    } catch (error) {
      console.error('Error deleting team:', error);
      addNotification('error', 'Hiba a csapat törlése során');
    }
  };

  const handleAddUserToTeam = async (teamId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert([
          {
            team_id: teamId,
            user_id: userId,
            role: 'member' as const
          }
        ]);

      if (error) throw error;

      await fetchTeamMembers();
      addNotification('success', 'Felhasználó sikeresen hozzáadva a csapathoz');
    } catch (error) {
      console.error('Error adding user to team:', error);
      addNotification('error', 'Hiba a felhasználó hozzáadása során');
    }
  };

  const handleRemoveUserFromTeam = async (teamId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchTeamMembers();
      addNotification('success', 'Felhasználó sikeresen eltávolítva a csapatból');
    } catch (error) {
      console.error('Error removing user from team:', error);
      addNotification('error', 'Hiba a felhasználó eltávolítása során');
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    assigned_to: string;
    team_id?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
  }) => {
    try {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('tasks')
        .insert([
          {
            ...taskData,
            assigned_by: user.id
          }
        ]);

      if (error) throw error;

      await fetchTasks();
      addNotification('success', 'Feladat sikeresen létrehozva');
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      addNotification('error', 'Hiba a feladat létrehozása során');
    }
  };

  const getTeamMembers = (teamId: string) => {
    return teamMembers.filter(member => member.team_id === teamId);
  };

  const getUnassignedUsers = () => {
    const assignedUserIds = teamMembers.map(member => member.user_id);
    return allUsers.filter(user => !assignedUserIds.includes(user.id));
  };

  const getTeamTasks = (teamId: string) => {
    return tasks.filter(task => task.team_id === teamId);
  };

  const handleDragStart = (user: Profile) => {
    setDraggedUser(user);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, teamId: string) => {
    e.preventDefault();
    if (draggedUser) {
      await handleAddUserToTeam(teamId, draggedUser.id);
      setDraggedUser(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {getTimeBasedGreeting()}
        </h1>
        <p className="text-gray-600">Csapatok és feladatok kezelése</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowTeamModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Új Csapat
        </button>
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Új Feladat
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Csapatok ({teams.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map(team => (
                <TeamCard
                  key={team.id}
                  team={team}
                  members={getTeamMembers(team.id)}
                  tasks={getTeamTasks(team.id)}
                  onEdit={(team: Team) => {
                    setSelectedTeam(team);
                    setShowTeamModal(true);
                  }}
                  onDelete={handleDeleteTeam}
                  onRemoveUser={handleRemoveUserFromTeam}
                  onDragOver={handleDragOver}
                  onDrop={(e: React.DragEvent) => handleDrop(e, team.id)}
                />
              ))}
            </div>
          </div>

          {/* Tasks Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Feladatok Áttekintése</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Függőben</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {tasks.filter(task => task.status === 'pending').length}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Folyamatban</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {tasks.filter(task => task.status === 'in_progress').length}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Kész</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {tasks.filter(task => task.status === 'completed').length}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Összes</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {tasks.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nem Beosztott Felhasználók
          </h2>
          <div className="space-y-2">
            {getUnassignedUsers().map(user => (
              <UserCard
                key={user.id}
                user={user}
                onDragStart={() => handleDragStart(user)}
              />
            ))}
          </div>
          {getUnassignedUsers().length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Minden felhasználó be van osztva csapatokba
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTeamModal && (
        <TeamModal
          team={selectedTeam}
          onSave={selectedTeam ? 
            (data: { name: string; description?: string }) => handleUpdateTeam(selectedTeam.id, data) : 
            handleCreateTeam
          }
          onClose={() => {
            setShowTeamModal(false);
            setSelectedTeam(null);
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          teams={teams}
          users={allUsers}
          onSave={handleCreateTask}
          onClose={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
};