import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Team, Task } from '../../types/teams';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotifications } from '../../hooks/useNotifications';
import { StatCard } from '../common/StatCard';
import { 
  CheckCircle, 
  AlertCircle,
  Target,
  Calendar,
  User,
  Users
} from 'lucide-react';

export const EnhancedOfficeDashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch user's teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          team_members!inner(user_id)
        `)
        .eq('team_members.user_id', currentUserId);

      if (teamsError) throw teamsError;

      // Fetch user's tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', currentUserId);

      if (tasksError) throw tasksError;

      setTeams(teamsData || []);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      addNotification('error', 'Hiba történt az adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const overdue = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    ).length;

    return { total, completed, inProgress, pending, overdue };
  };

  const getUpcomingTasks = () => {
    return tasks
      .filter(task => task.due_date && task.status !== 'completed')
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5);
  };

  const getRecentCompletedTasks = () => {
    return tasks
      .filter(task => task.status === 'completed' && task.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 5);
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (priority) {
      case 'urgent': return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'high': return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`;
      case 'medium': return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'low': return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      default: return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed': return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'in_progress': return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'cancelled': return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
      default: return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  };

  const taskStats = getTaskStats();
  const upcomingTasks = getUpcomingTasks();
  const recentCompleted = getRecentCompletedTasks();
  const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Csapatom"
          value={teams.length}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950/20"
        />
        <StatCard
          title="Feladataim"
          value={taskStats.total}
          icon={Target}
          iconColor="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-950/20"
        />
        <StatCard
          title="Befejezett"
          value={taskStats.completed}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard
          title="Lejárt"
          value={taskStats.overdue}
          icon={AlertCircle}
          iconColor="text-red-600"
          bgColor="bg-red-50 dark:bg-red-950/20"
        />
      </div>

      {/* Progress Overview */}
      <div className="bg-background border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5" />
            Teljesítmény áttekintés
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Befejezési arány</span>
              <span className="text-sm font-medium">{completionRate.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
                <div className="text-sm text-muted-foreground">Várakozó</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                <div className="text-sm text-muted-foreground">Folyamatban</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                <div className="text-sm text-muted-foreground">Kész</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
                <div className="text-sm text-muted-foreground">Lejárt</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-background border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Közelgő határidők
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {upcomingTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={getPriorityBadge(task.priority)}>
                      {task.priority}
                    </span>
                    <span className={getStatusBadge(task.status)}>
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {task.due_date && new Date(task.due_date).toLocaleDateString('hu-HU')}
                  </div>
                  {task.due_date && new Date(task.due_date) < new Date() && (
                    <div className="text-xs text-red-600 font-medium">Lejárt</div>
                  )}
                </div>
              </div>
            ))}
            {upcomingTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nincsenek közelgő határidők
              </p>
            )}
          </div>
        </div>

        {/* Recent Completed */}
        <div className="bg-background border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Nemrég befejezett
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {recentCompleted.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={getPriorityBadge(task.priority)}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {task.completed_at && new Date(task.completed_at).toLocaleDateString('hu-HU')}
                  </div>
                </div>
              </div>
            ))}
            {recentCompleted.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Még nincsenek befejezett feladatok
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Teams Overview */}
      {teams.length > 0 && (
        <div className="bg-background border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Csapataim
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => (
                <div key={team.id} className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">{team.name}</h4>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mb-3">{team.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Csapattag
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};