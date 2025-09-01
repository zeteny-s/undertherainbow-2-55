import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, CheckCircle, XCircle, MessageSquare, Save } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  present: boolean;
  notes: string | null;
  student_id: string;
}

interface ClassAttendanceModalProps {
  onClose: () => void;
  classId: string;
  selectedDate?: string;
}

export const ClassAttendanceModal: React.FC<ClassAttendanceModalProps> = ({ 
  onClose, 
  classId, 
  selectedDate = new Date().toISOString().split('T')[0] 
}) => {
  const [classData, setClassData] = useState<{ id: string; name: string; house: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    fetchClassData();
  }, [classId, selectedDate]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      // Fetch class info
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select('id, name, house')
        .eq('id', classId)
        .single();

      if (classError) throw classError;
      setClassData(classInfo);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('class_id', classId)
        .order('name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch existing attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('id, present, notes, student_id')
        .eq('class_id', classId)
        .eq('attendance_date', selectedDate);

      if (attendanceError) throw attendanceError;
      setExistingRecords(attendanceData || []);

      // Initialize attendance state
      const initialAttendance: Record<string, boolean> = {};
      const initialNotes: Record<string, string> = {};

      studentsData?.forEach(student => {
        const record = attendanceData?.find(r => r.student_id === student.id);
        initialAttendance[student.id] = record ? record.present : true;
        initialNotes[student.id] = record?.notes || '';
      });

      setAttendance(initialAttendance);
      setNotes(initialNotes);
      setHasChanges(false);

    } catch (error) {
      console.error('Error fetching class data:', error);
      addNotification('error', 'Hiba az osztály adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceToggle = (studentId: string, present: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }));
    setHasChanges(true);
  };

  const handleNotesChange = (studentId: string, note: string) => {
    setNotes(prev => ({ ...prev, [studentId]: note }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user || !classData) return;

    setSaving(true);
    try {
      // Delete existing records for this class and date
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('class_id', classId)
        .eq('attendance_date', selectedDate);

      if (deleteError) throw deleteError;

      // Insert new records
      const recordsToInsert = students.map(student => ({
        class_id: classId,
        student_id: student.id,
        pedagogus_id: user.id,
        attendance_date: selectedDate,
        present: attendance[student.id] || false,
        notes: notes[student.id] || null
      }));

      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert(recordsToInsert);

      if (insertError) throw insertError;

      addNotification('success', 'Jelenlét sikeresen mentve');
      setHasChanges(false);
      
      // Refresh data to show updated records
      fetchClassData();
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      addNotification('error', 'Hiba a jelenlét mentésekor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return null;
  }

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = Object.values(attendance).filter(p => !p).length;
  const totalStudents = students.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-6 w-6 mr-3 text-blue-600" />
              {classData.name} - Jelenlét
            </h2>
            <p className="text-blue-700 mt-1">
              {new Date(selectedDate).toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 text-sm font-bold bg-blue-200 text-blue-800 rounded-full">
              {classData.house}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
              <div className="text-sm text-blue-700 font-medium">Összes gyerek</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-green-700 font-medium">Jelen</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-red-700 font-medium">Hiányzik</div>
            </div>
          </div>

          {/* Existing Records Notice */}
          {existingRecords.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Erre a napra már van jelenlét rögzítve. A módosítások felülírják a korábbi bejegyzéseket.
              </p>
            </div>
          )}

          {/* Students List */}
          <div className="space-y-4 mb-6">
            {students.map((student) => (
              <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    {student.name}
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAttendanceToggle(student.id, true)}
                      className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                        attendance[student.id]
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Jelen
                    </button>
                    
                    <button
                      onClick={() => handleAttendanceToggle(student.id, false)}
                      className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                        !attendance[student.id]
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Hiányzik
                    </button>
                  </div>
                </div>

                {!attendance[student.id] && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-2">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Megjegyzés (opcionális)
                    </label>
                    <input
                      type="text"
                      value={notes[student.id] || ''}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      placeholder="Hiányzás oka..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {students.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nincsenek gyerekek</h3>
              <p className="text-gray-600">
                Kérje meg az adminisztrátort, hogy adjon hozzá gyerekeket ehhez az osztályhoz.
              </p>
            </div>
          )}

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Nem mentett módosításai vannak. Ne felejtse el menteni a jelenlétet!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Bezárás
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || students.length === 0}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Mentés...' : 'Jelenlét mentése'}
          </button>
        </div>
      </div>
    </div>
  );
};
