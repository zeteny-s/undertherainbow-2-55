import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  MessageCircle, 
  CheckSquare,
  Clock,
  TrendingUp,
  UserCheck,
  Plus,
  Send,
  Upload,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TeacherStats {
  activeClasses: number;
  totalStudents: number;
  pendingTasks: number;
  weekEvents: number;
  attendanceRate: number;
  unreadMessages: number;
}

interface ClassOverview {
  id: string;
  name: string;
  house: string;
  studentCount: number;
  todayAttendance: {
    present: number;
    total: number;
  };
}

interface UpcomingEvent {
  id: string;
  title: string;
  start_time: string;
  location?: string | null;
}

interface RecentActivity {
  id: string;
  type: 'attendance' | 'document' | 'message' | 'event';
  description: string;
  timestamp: string;
}

interface TeacherDashboardProps {
  onTabChange?: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TeacherStats>({
    activeClasses: 0,
    totalStudents: 0,
    pendingTasks: 0,
    weekEvents: 0,
    attendanceRate: 0,
    unreadMessages: 0
  });
  const [classes, setClasses] = useState<ClassOverview[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Pedagógus';
    
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

  const loadTeacherData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch teacher's classes
      const { data: teacherClasses, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          house,
          students (count)
        `)
        .contains('pedagogus_ids', [user.id]);

      if (classesError) throw classesError;

      // Fetch today's attendance for teacher's classes
      const today = new Date().toISOString().split('T')[0];
      const classIds = teacherClasses?.map(c => c.id) || [];
      
      const { data: todayAttendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('class_id, present')
        .in('class_id', classIds)
        .eq('attendance_date', today);

      if (attendanceError) throw attendanceError;

      // Process class data with attendance
      const classesWithAttendance: ClassOverview[] = teacherClasses?.map(cls => {
        const attendance = todayAttendance?.filter(a => a.class_id === cls.id) || [];
        const present = attendance.filter(a => a.present).length;
        const total = attendance.length;

        return {
          id: cls.id,
          name: cls.name,
          house: cls.house,
          studentCount: cls.students?.[0]?.count || 0,
          todayAttendance: { present, total }
        };
      }) || [];

      setClasses(classesWithAttendance);

      // Fetch upcoming events for this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, location')
        .eq('user_id', user.id)
        .gte('start_time', startOfWeek.toISOString())
        .lte('start_time', endOfWeek.toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (eventsError) throw eventsError;

      setUpcomingEvents(events || []);

      // Fetch recent activities from last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const activities: RecentActivity[] = [];

      // Get recent attendance records (group by date and class to avoid duplicates)
      const { data: recentAttendance } = await supabase
        .from('attendance_records')
        .select(`
          class_id,
          attendance_date,
          created_at,
          classes!inner(name)
        `)
        .in('class_id', classIds)
        .eq('pedagogus_id', user.id)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false });

      if (recentAttendance) {
        // Remove duplicates by creating a unique key for each attendance session
        const uniqueAttendance = new Map();
        recentAttendance.forEach(record => {
          const key = `${record.class_id}-${record.attendance_date}`;
          if (!uniqueAttendance.has(key)) {
            uniqueAttendance.set(key, record);
          }
        });

        // Convert back to array and take latest 3
        Array.from(uniqueAttendance.values())
          .slice(0, 3)
          .forEach(record => {
            activities.push({
              id: `attendance-${record.class_id}-${record.attendance_date}`,
              type: 'attendance',
              description: `Jelenlét rögzítve - ${record.classes.name}`,
              timestamp: record.created_at
            });
          });
      }

      // Get recent calendar events created
      const { data: recentEvents } = await supabase
        .from('calendar_events')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentEvents) {
        recentEvents.forEach(event => {
          activities.push({
            id: event.id,
            type: 'event',
            description: `Esemény létrehozva - ${event.title}`,
            timestamp: event.created_at
          });
        });
      }

      // Sort activities by timestamp and remove any remaining duplicates
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const uniqueActivities = activities.filter((activity, index, arr) => 
        arr.findIndex(a => a.id === activity.id) === index
      );

      setRecentActivities(uniqueActivities.slice(0, 5));

      // Calculate stats
      const totalStudents = classesWithAttendance.reduce((sum, cls) => sum + cls.studentCount, 0);
      const totalPresent = classesWithAttendance.reduce((sum, cls) => sum + cls.todayAttendance.present, 0);
      const totalAttendanceRecords = classesWithAttendance.reduce((sum, cls) => sum + cls.todayAttendance.total, 0);
      const attendanceRate = totalAttendanceRecords > 0 ? Math.round((totalPresent / totalAttendanceRecords) * 100) : 0;

      setStats({
        activeClasses: classesWithAttendance.length,
        totalStudents,
        pendingTasks: 0, // Will be connected when task management is implemented
        weekEvents: events?.length || 0,
        attendanceRate,
        unreadMessages: 0 // Will be connected when messaging is implemented
      });

    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-surface flex items-center justify-center p-3 sm:p-4">
        <LoadingSpinner size="lg" text="Adatok betöltése..." />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-surface p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="w-full max-w-none mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {getTimeBasedGreeting()}
          </h1>
          <p className="text-foreground-muted text-sm sm:text-base">
            Üdvözöljük a pedagógus portálon
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 animate-fade-in">
          <StatCard
            title="Aktív Osztályok"
            value={stats.activeClasses}
            icon={GraduationCap}
            iconColor="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard
            title="Összes Diák"
            value={stats.totalStudents}
            icon={Users}
            iconColor="text-success"
            bgColor="bg-success/10"
          />
          <StatCard
            title="Feladatok"
            value={stats.pendingTasks}
            icon={CheckSquare}
            iconColor="text-warning"
            bgColor="bg-warning/10"
          />
          <StatCard
            title="Heti Események"
            value={stats.weekEvents}
            icon={Calendar}
            iconColor="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard
            title="Jelenlét"
            value={`${stats.attendanceRate}%`}
            icon={TrendingUp}
            iconColor="text-success"
            bgColor="bg-success/10"
          />
          <StatCard
            title="Üzenetek"
            value={stats.unreadMessages}
            icon={MessageCircle}
            iconColor="text-error"
            bgColor="bg-error/10"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6 sm:space-y-8">
            {/* My Tasks Section */}
            <div className="bg-surface-elevated border border-border rounded-xl p-4 sm:p-6 animate-fade-in hover-lift">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-warning" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Feladataim</h2>
                </div>
                <button 
                  onClick={() => onTabChange?.('tasks')}
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors mobile-touch-target"
                >
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              </div>
              
              <EmptyState
                icon={CheckSquare}
                title="Nincsenek feladatok"
                description="A feladatok itt jelennek meg, amikor az adminisztráció vagy vezetőség kiírja őket."
                action={{
                  label: "Feladatok megtekintése",
                  onClick: () => onTabChange?.('tasks')
                }}
              />
            </div>

            {/* Class Overview Section */}
            <div className="bg-surface-elevated border border-border rounded-xl p-4 sm:p-6 animate-fade-in hover-lift">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Osztályaim</h2>
              </div>

              {classes.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="Nincsenek hozzárendelt osztályok"
                  description="Az osztályok itt jelennek meg, amikor az adminisztráció hozzárendeli őket."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="bg-surface border border-border rounded-lg p-4 hover-glow transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{cls.name}</h3>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {cls.house}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Diákok:</span>
                          <span className="font-medium text-foreground">{cls.studentCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Mai jelenlét:</span>
                          <span className={`font-medium ${
                            cls.todayAttendance.total === 0 
                              ? 'text-foreground-muted' 
                              : 'text-success'
                          }`}>
                            {cls.todayAttendance.total === 0 
                              ? 'Nincs rögzítve'
                              : `${cls.todayAttendance.present}/${cls.todayAttendance.total}`
                            }
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onTabChange?.('jelenleti')}
                        className="w-full mt-3 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium mobile-touch-target"
                      >
                        Jelenlét felvétele
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-surface-elevated border border-border rounded-xl p-4 sm:p-6 animate-fade-in hover-lift">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Activity className="h-5 w-5 text-success" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Legutóbbi Tevékenységek</h2>
              </div>

              {recentActivities.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="Nincsenek legutóbbi tevékenységek"
                  description="A tevékenységek itt jelennek meg, amikor végez munkát a rendszerben."
                />
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <UserCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <p className="text-xs text-foreground-muted mt-1">
                          {new Date(activity.timestamp).toLocaleString('hu-HU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Quick Actions */}
            <div className="bg-surface-elevated border border-border rounded-xl p-4 sm:p-6 animate-fade-in hover-lift">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Gyors Műveletek</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onTabChange?.('jelenleti')}
                  className="p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all hover-lift text-center mobile-touch-target"
                >
                  <UserCheck className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <span className="text-xs font-medium text-foreground block">Jelenlét</span>
                </button>
                <button 
                  onClick={() => onTabChange?.('calendar')}
                  className="p-3 bg-success/10 hover:bg-success/20 rounded-lg transition-all hover-lift text-center mobile-touch-target"
                >
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-success" />
                  <span className="text-xs font-medium text-foreground block">Esemény</span>
                </button>
                <button 
                  onClick={() => onTabChange?.('chat')}
                  className="p-3 bg-warning/10 hover:bg-warning/20 rounded-lg transition-all hover-lift text-center mobile-touch-target"
                >
                  <Send className="h-5 w-5 mx-auto mb-2 text-warning" />
                  <span className="text-xs font-medium text-foreground block">Üzenet</span>
                </button>
                <button 
                  onClick={() => onTabChange?.('documents')}
                  className="p-3 bg-error/10 hover:bg-error/20 rounded-lg transition-all hover-lift text-center mobile-touch-target"
                >
                  <Upload className="h-5 w-5 mx-auto mb-2 text-error" />
                  <span className="text-xs font-medium text-foreground block">Dokumentum</span>
                </button>
              </div>
            </div>

            {/* Schedule & Events */}
            <div className="bg-surface-elevated border border-border rounded-xl p-4 sm:p-6 animate-fade-in hover-lift">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Heti Események</h2>
                </div>
                <button 
                  onClick={() => onTabChange?.('calendar')}
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors mobile-touch-target"
                >
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              </div>

              {upcomingEvents.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Nincsenek események"
                  description="Az események itt jelennek meg a hét folyamán."
                />
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-surface rounded-lg border border-border">
                      <h4 className="font-medium text-foreground text-sm">{event.title}</h4>
                      <p className="text-xs text-foreground-muted mt-1">
                        {new Date(event.start_time).toLocaleString('hu-HU', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {event.location && (
                        <p className="text-xs text-foreground-subtle mt-1">{event.location}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Communication Center */}
            <div className="bg-surface-elevated border border-border rounded-xl p-4 sm:p-6 animate-fade-in hover-lift">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-warning" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Kommunikáció</h2>
              </div>

              <EmptyState
                icon={MessageCircle}
                title="Nincsenek új üzenetek"
                description="Az üzenetek és közlemények itt jelennek meg."
                action={{
                  label: "Chat megnyitása",
                  onClick: () => onTabChange?.('chat')
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};