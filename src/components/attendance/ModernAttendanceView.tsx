import React, { useState, useEffect } from 'react';
import { Users, Plus, Calendar, TrendingUp, BookOpen, User } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { CreateClassModal } from './CreateClassModal';
import { ClassDetailModal } from './ClassDetailModal';
import { AttendanceReportsModal } from './AttendanceReportsModal';
import { ModernMissingAlert } from './ModernMissingAlert';
import { useNotifications } from '../../hooks/useNotifications';

interface Class {
  id: string;
  name: string;
  house: string;
  pedagogus_id: string | null;
  created_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
  };
  student_count?: number;
}

export const ModernAttendanceView: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          house,
          pedagogus_id,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get student counts and profile data separately
      const classesWithCounts = await Promise.all(
        (data || []).map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          // Get profile data for pedagogus
          let profiles = undefined;
          if (cls.pedagogus_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('user_id', cls.pedagogus_id)
              .single();
            profiles = profileData || undefined;
          }

          return {
            ...cls,
            student_count: count || 0,
            profiles,
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error('Error fetching classes:', error);
      addNotification('error', 'Hiba az osztályok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleClassCreated = () => {
    setShowCreateModal(false);
    fetchClasses();
    addNotification('success', 'Osztály sikeresen létrehozva!');
  };

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(cls);
  };

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
  const assignedPedagogus = classes.filter((cls) => cls.pedagogus_id).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground-subtle border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground-muted">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-hover mobile-no-overflow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="heading-2 bg-gradient-primary bg-clip-text text-transparent mb-2">
                  Jelenléti rendszer
                </h1>
                <p className="text-foreground-muted body-text">
                  Osztályok és pedagógusok kezelése
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center justify-center gap-2 px-4 py-3 mobile-text-sm font-semibold mobile-touch-target"
                >
                  <Plus className="w-4 h-4" />
                  <span>Új osztály</span>
                </button>
                
                <button
                  onClick={() => setShowReportsModal(true)}
                  className="glass-button flex items-center justify-center gap-2 px-4 py-3 mobile-text-sm font-medium mobile-touch-target"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Riportok</span>
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
              <div className="glass-card rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">{classes.length}</p>
                    <p className="mobile-text-sm sm:text-sm text-foreground-muted mt-1">Osztály</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-success">{assignedPedagogus}</p>
                    <p className="mobile-text-sm sm:text-sm text-foreground-muted mt-1">Pedagógus</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-warning">{totalStudents}</p>
                    <p className="mobile-text-sm sm:text-sm text-foreground-muted mt-1">Gyerek</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Attendance Alert */}
        <div className="mb-6 sm:mb-8">
          <ModernMissingAlert />
        </div>

        {/* Classes Section */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-DEFAULT">
            <h2 className="heading-3 text-foreground flex items-center gap-2 sm:gap-3">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span>Osztályok ({classes.length})</span>
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            {classes.length === 0 ? (
              <div className="text-center py-12 sm:py-16 px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-foreground-subtle" />
                </div>
                <h3 className="heading-3 text-foreground mb-2">
                  Még nincsenek osztályok
                </h3>
                <p className="text-foreground-muted body-text mb-6 max-w-md mx-auto leading-relaxed">
                  Kezdje el az első osztály létrehozásával és adjon hozzá gyerekeket és pedagógusokat.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 font-semibold mobile-touch-target"
                >
                  <Plus className="w-4 h-4" />
                  Első osztály létrehozása
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => handleClassSelect(cls)}
                    className="group glass-card hover-lift cursor-pointer transition-all duration-200 p-4 sm:p-6 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="heading-3 text-foreground group-hover:text-primary transition-colors truncate flex-1 pr-2">
                        {cls.name}
                      </h3>
                      <span className="px-2 py-1 mobile-text-xs font-medium bg-primary/10 text-primary rounded-md flex-shrink-0">
                        {cls.house}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3 text-foreground-muted min-w-0">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="mobile-text-xs sm:text-sm truncate">
                          {cls.profiles?.name || 'Nincs hozzárendelve'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-foreground-muted">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="mobile-text-xs sm:text-sm font-medium">
                          {cls.student_count} gyerek
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-DEFAULT">
                      <p className="mobile-text-xs text-foreground-subtle group-hover:text-primary transition-colors">
                        Kattintson a részletekért →
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateClassModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleClassCreated}
          />
        )}

        {selectedClass && (
          <ClassDetailModal
            classData={selectedClass}
            onClose={() => setSelectedClass(null)}
            onUpdate={fetchClasses}
          />
        )}

        {showReportsModal && (
          <AttendanceReportsModal onClose={() => setShowReportsModal(false)} />
        )}
      </div>
    </div>
  );
};