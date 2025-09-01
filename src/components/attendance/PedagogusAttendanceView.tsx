import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceForm } from './AttendanceForm';
import { AttendanceHistoryModal } from './AttendanceHistoryModal';
import { useNotifications } from '../../hooks/useNotifications';

interface Class {
  id: string;
  name: string;
  house: string;
  students: Student[];
}

interface Student {
  id: string;
  name: string;
  class_id: string;
}

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  present: boolean;
  student_id: string;
  notes?: string | null;
}

export const PedagogusAttendanceView: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchTodayAttendance();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const profileType = user?.user_metadata?.profile_type;
      let query = supabase
        .from('classes')
        .select(`
          *,
          students (*)
        `);

      // If pedagogus, only show their classes
      // If admin or house leader, show all classes
      if (profileType === 'pedagogus') {
        query = query.contains('pedagogus_ids', [user!.id]);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      addNotification('error', 'Hiba az osztályok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    if (!selectedClass) return;

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('class_id', selectedClass.id)
        .eq('attendance_date', today);

      if (error) throw error;
      setTodayAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      addNotification('error', 'Hiba a jelenlét betöltésekor');
    }
  };

  const handleAttendanceSubmit = async (attendanceData: Record<string, boolean>, notes: Record<string, string>) => {
    if (!selectedClass || !user) return;

    try {
      // Prepare attendance records
      const records = Object.entries(attendanceData).map(([studentId, present]) => ({
        student_id: studentId,
        class_id: selectedClass.id,
        pedagogus_id: user.id,
        attendance_date: today,
        present,
        notes: notes[studentId] || null
      }));

      // Delete existing records for today (if any) and insert new ones
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('class_id', selectedClass.id)
        .eq('attendance_date', today);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert(records);

      if (insertError) throw insertError;

      addNotification('success', 'Jelenlét sikeresen rögzítve!');
      fetchTodayAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
      addNotification('error', 'Hiba a jelenlét mentésekor');
    }
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

  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Jelenléti rendszer</h1>
            <p className="text-gray-600 mb-4">
              Még nincs osztály hozzárendelve a fiókjához.
            </p>
            <p className="text-sm text-gray-500">
              Kérje meg az adminisztrátort, hogy rendeljen osztályt a fiókjához.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jelenléti rendszer</h1>
          <p className="text-gray-600">Mai nap: {new Date().toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}</p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            {selectedClass && (
              <button 
                onClick={() => setShowHistory(true)}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Korábbi jelenlétek
              </button>
            )}
          </div>
          
          {/* Statistics Cards */}
          {selectedClass && todayAttendance.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedClass.students?.length || 0}</div>
                <div className="text-sm text-gray-600">Gyerek</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {todayAttendance.filter(a => a.present).length}
                </div>
                <div className="text-sm text-gray-600">Jelen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {todayAttendance.filter(a => !a.present).length}
                </div>
                <div className="text-sm text-gray-600">Hiányzik</div>
              </div>
            </div>
          )}
        </div>

        {/* Class Selection */}
        {classes.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BookOpen className="h-6 w-6 mr-3 text-blue-600" />
                Osztály kiválasztása
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`group p-6 text-left border rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                      selectedClass?.id === cls.id
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-gradient-to-br from-white to-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-lg font-semibold transition-colors ${
                        selectedClass?.id === cls.id ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                      }`}>
                        {cls.name}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {cls.house}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm font-medium">{cls.students?.length || 0} gyerek</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Form */}
        {selectedClass && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-3 text-blue-600" />
                Jelenlét rögzítése - {selectedClass.name}
              </h2>
            </div>
            <div className="p-6">
              <AttendanceForm
                classData={selectedClass}
                todayAttendance={todayAttendance.map(record => ({
                  ...record,
                  notes: record.notes || undefined
                }))}
                onSubmit={handleAttendanceSubmit}
              />
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistory && selectedClass && (
          <AttendanceHistoryModal
            classData={selectedClass}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  );
};