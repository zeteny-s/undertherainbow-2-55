import React, { useState, useEffect } from 'react';
import { Users, Plus, BookOpen, Calendar, UserPlus } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { CreateClassModal } from './CreateClassModal';
import { ClassDetailModal } from './ClassDetailModal';
import { AttendanceReportsModal } from './AttendanceReportsModal';
import { MissingAttendanceAlert } from './MissingAttendanceAlert';
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
export const AdminAttendanceView: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const {
    addNotification
  } = useNotifications();
  useEffect(() => {
    fetchClasses();
  }, []);
  const fetchClasses = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('classes').select(`
          id,
          name,
          house,
          pedagogus_id,
          created_at
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Get student counts and profile data separately
      const classesWithCounts = await Promise.all((data || []).map(async cls => {
        const {
          count
        } = await supabase.from('students').select('*', {
          count: 'exact',
          head: true
        }).eq('class_id', cls.id);

        // Get profile data for pedagogus
        let profiles = undefined;
        if (cls.pedagogus_id) {
          const {
            data: profileData
          } = await supabase.from('profiles').select('name, email').eq('user_id', cls.pedagogus_id).single();
          profiles = profileData || undefined;
        }
        return {
          ...cls,
          student_count: count || 0,
          profiles
        };
      }));
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

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jelenléti rendszer</h1>
          <p className="text-gray-600">Osztályok és pedagógusok kezelése</p>
        </div>

        {/* Missing Attendance Alert */}
        <MissingAttendanceAlert />

        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setShowCreateModal(true)} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-sm">
              <Plus className="h-5 w-5 mr-2" />
              Új osztály létrehozása
            </button>
            <button onClick={() => setShowReportsModal(true)} className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105 shadow-sm">
              <Calendar className="h-5 w-5 mr-2" />
              Jelenlét riportok
            </button>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
              <div className="text-sm text-gray-600">Osztály</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {classes.filter(cls => cls.pedagogus_id).length}
              </div>
              <div className="text-sm text-gray-600">Pedagógusok</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Gyerek</div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-3 text-blue-600" />
              Osztályok ({classes.length})
            </h2>
          </div>
          
          <div className="p-6">
            {classes.length === 0 ? <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Még nincsenek osztályok</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Kezdje el az első osztály létrehozásával és adjon hozzá gyerekeket és pedagógusokat.
                </p>
                <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-sm">
                  <Plus className="h-5 w-5 mr-2 inline" />
                  Első osztály létrehozása
                </button>
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {classes.map(cls => <div key={cls.id} onClick={() => handleClassSelect(cls)} className="group p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {cls.name}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {cls.house}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <UserPlus className="h-4 w-4 mr-3 text-gray-400" />
                        <span className="text-sm">
                          {cls.profiles?.name || 'Nincs hozzárendelve pedagógus'}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <BookOpen className="h-4 w-4 mr-3 text-gray-400" />
                        <span className="text-sm font-medium">
                          {cls.student_count} gyerek
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Kattintson a részletekért
                      </div>
                    </div>
                  </div>)}
              </div>}
          </div>
        </div>

        {/* Modals */}
        {showCreateModal && <CreateClassModal onClose={() => setShowCreateModal(false)} onSuccess={handleClassCreated} />}

        {selectedClass && <ClassDetailModal classData={selectedClass} onClose={() => setSelectedClass(null)} onUpdate={fetchClasses} />}

        {showReportsModal && <AttendanceReportsModal onClose={() => setShowReportsModal(false)} />}
      </div>
    </div>;
};