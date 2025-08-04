import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Clock, Target, Download } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { StatCard } from '../../common/StatCard';

interface TeamAnalyticsProps {
  selectedTimeRange: string;
}

interface TaskCompletionTrend {
  date: string;
  completed: number;
  created: number;
  efficiency: number;
}

interface TeamProductivity {
  team_name: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  avg_completion_time: number;
}

interface IndividualPerformance {
  user_name: string;
  total_tasks: number;
  tasks_completed: number;
  completion_rate: number;
  avg_time_to_complete: number;
}

export const TeamAnalytics: React.FC<TeamAnalyticsProps> = ({ selectedTimeRange }) => {
  const [loading, setLoading] = useState(true);
  const [completionTrends, setCompletionTrends] = useState<TaskCompletionTrend[]>([]);
  const [teamProductivity, setTeamProductivity] = useState<TeamProductivity[]>([]);
  const [individualPerformance, setIndividualPerformance] = useState<IndividualPerformance[]>([]);
  const [taskDistribution, setTaskDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (selectedTimeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      await Promise.all([
        fetchCompletionTrends(startDate, endDate),
        fetchTeamProductivity(startDate, endDate),
        fetchIndividualPerformance(startDate, endDate),
        fetchTaskDistribution(startDate, endDate)
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletionTrends = async (startDate: string, endDate: string) => {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('created_at, completed_at, status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    // Group by date and calculate completion trends
    const trendsMap = new Map();
    
    tasks?.forEach(task => {
      const date = new Date(task.created_at).toISOString().split('T')[0];
      
      if (!trendsMap.has(date)) {
        trendsMap.set(date, { date, completed: 0, created: 0, efficiency: 0 });
      }
      
      const trend = trendsMap.get(date);
      trend.created++;
      
      if (task.status === 'completed') {
        trend.completed++;
      }
      
      trend.efficiency = trend.created > 0 ? (trend.completed / trend.created) * 100 : 0;
    });

    setCompletionTrends(Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
  };

  const fetchTeamProductivity = async (startDate: string, endDate: string) => {
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        tasks!inner (
          id,
          status,
          created_at,
          completed_at
        )
      `);

    if (teamsError) throw teamsError;

    const productivity = teams?.map(team => {
      const teamTasks = team.tasks.filter(task => 
        task.created_at >= startDate && task.created_at <= endDate
      );
      
      const completedTasks = teamTasks.filter(task => task.status === 'completed');
      const completionRate = teamTasks.length > 0 ? (completedTasks.length / teamTasks.length) * 100 : 0;
      
      // Calculate average completion time
      const avgCompletionTime = completedTasks.length > 0 
        ? completedTasks.reduce((acc, task) => {
            if (task.completed_at && task.created_at) {
              const timeDiff = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
              return acc + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
            }
            return acc;
          }, 0) / completedTasks.length
        : 0;

      return {
        team_name: team.name,
        total_tasks: teamTasks.length,
        completed_tasks: completedTasks.length,
        completion_rate: completionRate,
        avg_completion_time: avgCompletionTime
      };
    }) || [];

    setTeamProductivity(productivity);
  };

  const fetchIndividualPerformance = async (startDate: string, endDate: string) => {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        assigned_to,
        status,
        created_at,
        completed_at
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    // Get user profiles separately
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email');

    if (profilesError) throw profilesError;

    // Group by user and calculate performance metrics
    const performanceMap = new Map();
    
    tasks?.forEach((task: any) => {
      const userId = task.assigned_to;
      const userProfile = profiles?.find(p => p.id === userId);
      const userName = userProfile?.name || userProfile?.email || 'Unknown User';
      
      if (!performanceMap.has(userId)) {
        performanceMap.set(userId, {
          user_name: userName,
          total_tasks: 0,
          completed_tasks: 0,
          completion_rate: 0,
          total_completion_time: 0,
          avg_time_to_complete: 0
        });
      }
      
      const performance = performanceMap.get(userId);
      performance.total_tasks++;
      
      if (task.status === 'completed') {
        performance.completed_tasks++;
        
        if (task.completed_at && task.created_at) {
          const timeDiff = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
          performance.total_completion_time += (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }
      }
      
      performance.completion_rate = performance.total_tasks > 0 ? (performance.completed_tasks / performance.total_tasks) * 100 : 0;
      performance.avg_time_to_complete = performance.completed_tasks > 0 ? performance.total_completion_time / performance.completed_tasks : 0;
    });

    setIndividualPerformance(Array.from(performanceMap.values()).sort((a, b) => b.completion_rate - a.completion_rate));
  };

  const fetchTaskDistribution = async (startDate: string, endDate: string) => {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('priority, status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    // Calculate task distribution by priority and status
    const priorityDist = tasks?.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);


    const priorityData = Object.entries(priorityDist || {}).map(([priority, count]) => ({
      name: priority,
      value: count,
      color: priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f97316' : priority === 'medium' ? '#eab308' : '#22c55e'
    }));

    setTaskDistribution(priorityData);
  };

  const exportData = () => {
    const exportData = {
      completion_trends: completionTrends,
      team_productivity: teamProductivity,
      individual_performance: individualPerformance,
      task_distribution: taskDistribution,
      generated_at: new Date().toISOString(),
      time_range: selectedTimeRange
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-analytics-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Csapat Analitika</h2>
          <p className="text-gray-600">Részletes teljesítmény és trend jelentések</p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Adatok
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Átlagos Befejezési Ráta"
          value={`${(teamProductivity.reduce((acc, team) => acc + team.completion_rate, 0) / teamProductivity.length || 0).toFixed(1)}%`}
          icon={Target}
          iconColor="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Aktív Csapatok"
          value={teamProductivity.filter(team => team.total_tasks > 0).length.toString()}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Átlagos Befejezési Idő"
          value={`${(teamProductivity.reduce((acc, team) => acc + team.avg_completion_time, 0) / teamProductivity.length || 0).toFixed(1)} nap`}
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Teljesítmény Trend"
          value={completionTrends.length > 1 && completionTrends[completionTrends.length - 1].efficiency > completionTrends[0].efficiency ? "↗️ Növekvő" : "↘️ Csökkenő"}
          icon={TrendingUp}
          iconColor="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Completion Trends Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feladat Befejezési Trendek</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={completionTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Befejezett" />
            <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} name="Létrehozott" />
            <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={2} name="Hatékonyság %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Productivity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Csapat Produktivitás</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamProductivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completion_rate" fill="#3b82f6" name="Befejezési Ráta %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feladat Eloszlás Prioritás Szerint</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Egyéni Teljesítmény</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Felhasználó
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Összes Feladat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Befejezett
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Befejezési Ráta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Átlagos Idő (nap)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {individualPerformance.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.user_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.total_tasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.tasks_completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.completion_rate >= 80 ? 'bg-green-100 text-green-800' :
                      user.completion_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.completion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.avg_time_to_complete.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};