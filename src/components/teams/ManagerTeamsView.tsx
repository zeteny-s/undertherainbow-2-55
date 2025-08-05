import React, { useState, useEffect } from 'react';
import { Plus, Users, UserPlus, Settings } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Team, TeamMember, Task, Profile } from '../../types/teams';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { TeamCard } from './TeamCard';
import { UserCard } from './UserCard';
import { TeamModal } from './TeamModal';
import { TaskModal } from './TaskModal';
import { useNotifications } from '../../hooks/useNotifications';

export const ManagerTeamsView: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [draggedUser, setDraggedUser] = useState<Profile | null>(null);
  
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTeams(data || []);
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setUsers(data || []);
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles (
          name,
          email,
          profile_type
        )
      `);
    
    if (error) throw error;
    setMembers(data as any || []);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:profiles!assigned_to (
          name,
          email
        )
      `);
    
    if (error) throw error;
    setTasks(data as any || []);
  };

  const handleCreateTeam = async (teamData: { name: string; description?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          created_by: user.id
        });

      if (error) throw error;
      
      await fetchTeams();
      setShowTeamModal(false);
      addNotification('success', 'Csapat sikeresen létrehozva');
    } catch (error) {
      console.error('Error creating team:', error);
      addNotification('error', 'Hiba történt a csapat létrehozása során');
    }
  };

  const handleUpdateTeam = async (teamId: string, teamData: { name: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: teamData.name,
          description: teamData.description
        })
        .eq('id', teamId);

      if (error) throw error;
      
      await fetchTeams();
      setSelectedTeam(null);
      addNotification('success', 'Csapat sikeresen frissítve');
    } catch (error) {
      console.error('Error updating team:', error);
      addNotification('error', 'Hiba történt a csapat frissítése során');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      
      await fetchData();
      addNotification('success', 'Csapat sikeresen törölve');
    } catch (error) {
      console.error('Error deleting team:', error);
      addNotification('error', 'Hiba történt a csapat törlése során');
    }
  };

  const handleAddUserToTeam = async (teamId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: 'member'
        });

      if (error) throw error;
      
      await fetchTeamMembers();
      addNotification('success', 'Felhasználó sikeresen hozzáadva a csapathoz');
    } catch (error) {
      console.error('Error adding user to team:', error);
      addNotification('error', 'Hiba történt a felhasználó hozzáadása során');
    }
  };

  const handleRemoveUserFromTeam = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
      
      await fetchTeamMembers();
      addNotification('success', 'Felhasználó eltávolítva a csapatból');
    } catch (error) {
      console.error('Error removing user from team:', error);
      addNotification('error', 'Hiba történt a felhasználó eltávolítása során');
    }
  };

  const handleUpdateUserRole = async (membershipId: string, role: 'member' | 'lead') => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', membershipId);

      if (error) throw error;
      
      await fetchTeamMembers();
      addNotification('success', 'Felhasználó szerepe frissítve');
    } catch (error) {
      console.error('Error updating user role:', error);
      addNotification('error', 'Hiba történt a szerepkör frissítése során');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          assigned_to: taskData.assigned_to,
          assigned_by: user.id,
          team_id: taskData.team_id,
          priority: taskData.priority,
          due_date: taskData.due_date
        });

      if (error) throw error;
      
      await fetchTasks();
      setShowTaskModal(false);
      addNotification('success', 'Feladat sikeresen létrehozva');
    } catch (error) {
      console.error('Error creating task:', error);
      addNotification('error', 'Hiba történt a feladat létrehozása során');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks();
      addNotification('success', 'Feladat állapota frissítve');
    } catch (error) {
      console.error('Error updating task status:', error);
      addNotification('error', 'Hiba történt a feladat frissítése során');
    }
  };

  const getTeamMembers = (teamId: string) => {
    return members.filter(member => member.team_id === teamId);
  };

  const getUnassignedUsers = () => {
    const assignedUserIds = members.map(member => member.user_id);
    return users.filter(user => !assignedUserIds.includes(user.id));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Csapat Kezelés</h2>
          <p className="text-muted-foreground">Csapatok és feladatok központi kezelése</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTeamModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Új Csapat
          </button>
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Új Feladat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{teams.length}</p>
              <p className="text-sm text-muted-foreground">Csapatok</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-sm text-muted-foreground">Felhasználók</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">Függőben lévő</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Befejezett</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Csapatok</h2>
          {teams.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-dashed">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Még nincsenek csapatok</p>
              <button
                onClick={() => setShowTeamModal(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Első csapat létrehozása
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  members={getTeamMembers(team.id)}
                  tasks={getTeamTasks(team.id)}
                  onEdit={(team) => setSelectedTeam(team)}
                  onDelete={handleDeleteTeam}
                  onRemoveUser={(_teamId: string, userId: string) => handleRemoveUserFromTeam(userId)}
                  onUpdateUserRole={(_teamId: string, userId: string, role: 'member' | 'lead') => handleUpdateUserRole(userId, role)}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, team.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Unassigned Users */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Nem beosztott felhasználók</h2>
          <div className="bg-card rounded-lg border p-4 space-y-3">
            {getUnassignedUsers().length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Minden felhasználó be van osztva</p>
            ) : (
              getUnassignedUsers().map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onDragStart={() => handleDragStart(user)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTeamModal && (
        <TeamModal
          onSave={handleCreateTeam}
          onClose={() => setShowTeamModal(false)}
        />
      )}

      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          onSave={(data) => handleUpdateTeam(selectedTeam.id, data)}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          teams={teams}
          users={users}
          onSave={handleCreateTask}
          onClose={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
};