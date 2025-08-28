import React, { useState, useEffect } from 'react';
import { Users, Plus, Settings, BookOpen, Calendar, UserPlus } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { CreateClassModal } from './CreateClassModal';
import { ClassDetailModal } from './ClassDetailModal';
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
          created_at,
          profiles:pedagogus_id (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get student counts separately
      const classesWithCounts = await Promise.all((data || []).map(async (cls) => {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id);

        return {
          ...cls,
          student_count: count || 0
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jelenléti rendszer</h1>
          <p className="text-gray-600">Osztályok és pedagógusok kezelése</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Classes Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Osztályok ({classes.length})
                </h2>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Új osztály
                </button>
              </div>

              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Még nincsenek osztályok</h3>
                  <p className="text-gray-600 mb-4">Kezdje el az első osztály létrehozásával</p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Osztály létrehozása
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => handleClassSelect(cls)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {cls.house}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <UserPlus className="h-4 w-4 mr-2" />
                          {cls.profiles?.name || 'Nincs hozzárendelve pedagógus'}
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {cls.student_count} diák
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gyors műveletek</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 mr-3" />
                  Új osztály létrehozása
                </button>
                <button className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Calendar className="h-4 w-4 mr-3" />
                  Jelenlét riportok
                </button>
                <button className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings className="h-4 w-4 mr-3" />
                  Beállítások
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statisztikák</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Összes osztály:</span>
                  <span className="font-semibold">{classes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aktív pedagógusok:</span>
                  <span className="font-semibold">
                    {classes.filter(cls => cls.pedagogus_id).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Összes diák:</span>
                  <span className="font-semibold">
                    {classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
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
      </div>
    </div>
  );
};