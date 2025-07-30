import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Team, Task } from '../../types/teams';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const OfficeTeamsView: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchMyTeams(),
        fetchMyTasks()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeams = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get teams I'm a member of
    const { data: teamData, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members!inner (
          id,
          user_id,
          role,
          joined_at
        )
      `)
      .eq('team_members.user_id', user.id);
    
    if (error) throw error;
    setTeams(teamData || []);
  };

  const fetchMyTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:profiles!assigned_to (
          name,
          email
        )
      `)
      .eq('assigned_to', user.id);
    
    if (error) throw error;
    setTasks(data as any || []);
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
      
      await fetchMyTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Coming Soon Overlay - fixed to only cover content area, not sidebar */}
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm z-10 flex items-center justify-center pointer-events-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl max-w-md text-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Hamarosan érkezik!</h2>
          <p className="text-muted-foreground mb-4">
            Ez a funkció jelenleg fejlesztés alatt áll. Dolgozunk azon, hogy minél hamarabb elérhetővé tegyük.
          </p>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 dark:bg-blue-600 w-3/4"></div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">75% kész</p>
        </div>
      </div>
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Saját Csapatok</h1>
        <p className="text-muted-foreground mt-1">Csapat információk és feladatok</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{teams.length}</p>
              <p className="text-sm text-muted-foreground">Csapatok</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">Függőben</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status === 'in_progress').length}</p>
              <p className="text-sm text-muted-foreground">Folyamatban</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Befejezett</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Teams */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Csapataim</h2>
          {teams.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-dashed">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Még nincs csapathoz rendelve</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="bg-card rounded-lg border p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{team.name}</h3>
                      {team.description && (
                        <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Feladataim</h2>
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-dashed">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nincsenek feladatok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="bg-card rounded-lg border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground">{task.title}</h4>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-sm text-muted-foreground mb-3">
                      Határidő: {new Date(task.due_date).toLocaleDateString('hu-HU')}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Kezdés
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                      >
                        Befejezés
                      </button>
                    )}
                    {(task.status === 'pending' || task.status === 'in_progress') && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                      >
                        Törlés
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};