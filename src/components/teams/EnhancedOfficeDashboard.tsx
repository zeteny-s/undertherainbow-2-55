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
  Users,
  Clock,
  Play,
  Briefcase,
  Timer,
  Award,
  TrendingUp
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
      case 'urgent': return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      case 'high': return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400`;
      case 'medium': return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'low': return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      default: return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed': return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case 'in_progress': return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
      case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'cancelled': return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
      default: return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
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
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Munkaterület Áttekintés</h2>
            <p className="text-muted-foreground">Követd nyomon feladataidat és csapat teljesítményedet</p>
          </div>
        </div>
      </div>

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

      {/* Progress Overview - Enhanced */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border bg-gradient-to-r from-emerald-50 to-emerald-50/30 dark:from-emerald-950/20 dark:to-emerald-950/10">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Teljesítmény áttekintés
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Feladatkezelésed hatékonysága</p>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Befejezési arány</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{completionRate.toFixed(0)}%</span>
                {completionRate >= 80 && <Award className="h-5 w-5 text-yellow-500" />}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 h-4 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100/30 dark:from-yellow-950/20 dark:to-yellow-950/10 rounded-lg border border-yellow-200/50">
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
                <div className="text-sm text-muted-foreground">Várakozó</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-950/10 rounded-lg border border-blue-200/50">
                <Play className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                <div className="text-sm text-muted-foreground">Folyamatban</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100/30 dark:from-green-950/20 dark:to-green-950/10 rounded-lg border border-green-200/50">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                <div className="text-sm text-muted-foreground">Kész</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100/30 dark:from-red-950/20 dark:to-red-950/10 rounded-lg border border-red-200/50">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
                <div className="text-sm text-muted-foreground">Lejárt</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks - Enhanced */}
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border bg-gradient-to-r from-orange-50 to-orange-50/30 dark:from-orange-950/20 dark:to-orange-950/10">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Közelgő határidők
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Figyelmet igénylő feladatok</p>
          </div>
          <div className="p-6 space-y-4">
            {upcomingTasks.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              const daysDiff = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <div key={task.id} className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                  isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20' : 
                  daysDiff <= 1 ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800/50 dark:bg-yellow-950/20' :
                  'border-border hover:border-primary/30'
                }`}>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={getPriorityBadge(task.priority)}>
                        {task.priority === 'high' ? 'Magas' : task.priority === 'medium' ? 'Közepes' : task.priority === 'low' ? 'Alacsony' : task.priority}
                      </span>
                      <span className={getStatusBadge(task.status)}>
                        {task.status === 'pending' ? 'Várakozó' : task.status === 'in_progress' ? 'Folyamatban' : task.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : daysDiff <= 1 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {task.due_date && new Date(task.due_date).toLocaleDateString('hu-HU')}
                    </div>
                    {isOverdue && (
                      <div className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Lejárt
                      </div>
                    )}
                    {!isOverdue && daysDiff <= 1 && daysDiff >= 0 && (
                      <div className="text-xs text-yellow-600 font-medium">
                        {daysDiff === 0 ? 'Ma' : '1 nap'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {upcomingTasks.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nincsenek közelgő határidők</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Minden feladat időben halad</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Completed - Enhanced */}
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border bg-gradient-to-r from-green-50 to-green-50/30 dark:from-green-950/20 dark:to-green-950/10">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Nemrég befejezett
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Legutóbbi eredményeid</p>
          </div>
          <div className="p-6 space-y-4">
            {recentCompleted.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-4 border border-green-200/50 rounded-lg bg-gradient-to-r from-green-50/30 to-green-50/10 dark:border-green-800/30 dark:bg-green-950/10">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={getPriorityBadge(task.priority)}>
                      {task.priority === 'high' ? 'Magas' : task.priority === 'medium' ? 'Közepes' : task.priority === 'low' ? 'Alacsony' : task.priority}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      Befejezve
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-medium">
                    {task.completed_at && new Date(task.completed_at).toLocaleDateString('hu-HU')}
                  </div>
                </div>
              </div>
            ))}
            {recentCompleted.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Még nincsenek befejezett feladatok</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Kezdd el a munkát a feladatokon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teams Overview - Enhanced */}
      {teams.length > 0 && (
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border bg-gradient-to-r from-blue-50 to-blue-50/30 dark:from-blue-950/20 dark:to-blue-950/10">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Csapataim
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Csapatok amikben részt veszel</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => {
                const teamTasks = tasks.filter(t => t.team_id === team.id);
                const completedTeamTasks = teamTasks.filter(t => t.status === 'completed');
                const teamProgress = teamTasks.length > 0 ? (completedTeamTasks.length / teamTasks.length) * 100 : 0;
                
                return (
                  <div key={team.id} className="p-4 border border-border rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-foreground">{team.name}</h4>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {teamProgress.toFixed(0)}%
                      </span>
                    </div>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{team.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Csapattag
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {completedTeamTasks.length}/{teamTasks.length} feladat
                      </div>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-primary to-primary/80 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${teamProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};