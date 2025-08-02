import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Team, TeamMember, Task, Profile } from '../../types/teams';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotifications } from '../../hooks/useNotifications';
import { StatCard } from '../common/StatCard';
import { 
  Users, 
  Target, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';

export const EnhancedManagerDashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [teamsData, membersData, tasksData, usersData] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('profiles').select('*')
      ]);

      if (teamsData.error) throw teamsData.error;
      if (membersData.error) throw membersData.error;
      if (tasksData.error) throw tasksData.error;
      if (usersData.error) throw usersData.error;

      setTeams(teamsData.data || []);
      setMembers(membersData.data || []);
      setTasks(tasksData.data || []);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getTeamPerformance = () => {
    return teams.map(team => {
      const teamTasks = tasks.filter(task => task.team_id === team.id);
      const completedTasks = teamTasks.filter(task => task.status === 'completed').length;
      const totalTasks = teamTasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      return {
        ...team,
        totalTasks,
        completedTasks,
        completionRate,
        memberCount: members.filter(member => member.team_id === team.id).length
      };
    });
  };

  const getTopPerformers = () => {
    const userTaskStats = users.map(user => {
      const userTasks = tasks.filter(task => task.assigned_to === user.id);
      const completed = userTasks.filter(task => task.status === 'completed').length;
      const total = userTasks.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      return {
        ...user,
        totalTasks: total,
        completedTasks: completed,
        completionRate
      };
    });

    return userTaskStats
      .filter(user => user.totalTasks > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
  };

  const taskStats = getTaskStats();
  const teamPerformance = getTeamPerformance();
  const topPerformers = getTopPerformers();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Összes csapat"
          value={teams.length}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950/20"
        />
        <StatCard
          title="Aktív feladatok"
          value={taskStats.inProgress + taskStats.pending}
          icon={Target}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50 dark:bg-yellow-950/20"
        />
        <StatCard
          title="Befejezett feladatok"
          value={taskStats.completed}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard
          title="Lejárt feladatok"
          value={taskStats.overdue}
          icon={AlertCircle}
          iconColor="text-red-600"
          bgColor="bg-red-50 dark:bg-red-950/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="bg-background border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Csapat teljesítmény
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {teamPerformance.map(team => (
              <div key={team.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {team.memberCount} tag • {team.completedTasks}/{team.totalTasks} feladat
                    </p>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {team.completionRate.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${team.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
            {teamPerformance.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Még nincsenek csapatok
              </p>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-background border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5" />
              Legjobb teljesítők
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {performer.name || performer.email}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {performer.completedTasks}/{performer.totalTasks} feladat • {performer.completionRate.toFixed(0)}%
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    performer.completionRate >= 80 ? 'text-green-600' :
                    performer.completionRate >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {performer.completionRate.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Még nincsenek teljesítményadatok
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Task Overview */}
      <div className="bg-background border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Feladat áttekintés
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{taskStats.pending}</div>
              <div className="text-sm text-blue-600">Várakozó</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</div>
              <div className="text-sm text-yellow-600">Folyamatban</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-sm text-green-600">Kész</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
              <div className="text-sm text-red-600">Lejárt</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};