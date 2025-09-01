import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, CheckCircle, XCircle, Save, Edit, MessageSquare } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';

interface EditableAttendanceModalProps {
  onClose: () => void;
  classData: {
    id: string;
    name: string;
    house: string;
  };
  selectedDate: string;
}

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

interface StudentWithAttendance extends Student {
  present: boolean;
  notes: string;
  hasRecord: boolean;
  recordId?: string;
}

export const EditableAttendanceModal: React.FC<EditableAttendanceModalProps> = ({
  onClose,
  classData,
  selectedDate
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [editingAttendance, setEditingAttendance] = useState<Record<string, boolean>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchStudentsAndAttendance();
  }, [classData.id, selectedDate]);

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('class_id', classData.id)
        .order('name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('id, present, notes, student_id')
        .eq('class_id', classData.id)
        .eq('attendance_date', selectedDate);

      if (attendanceError) throw attendanceError;
      setAttendanceRecords(attendanceData || []);

      // Initialize editing state
      const attendanceMap: Record<string, boolean> = {};
      const notesMap: Record<string, string> = {};

      (studentsData || []).forEach(student => {
        const record = (attendanceData || []).find(r => r.student_id === student.id);
        attendanceMap[student.id] = record?.present || false;
        notesMap[student.id] = record?.notes || '';
      });

      setEditingAttendance(attendanceMap);
      setEditingNotes(notesMap);

    } catch (error) {
      console.error('Error fetching data:', error);
      addNotification('error', 'Hiba az adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Nincs bejelentkezett felhasználó');
      }

      // Delete existing records for this date and class
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('class_id', classData.id)
        .eq('attendance_date', selectedDate);

      if (deleteError) throw deleteError;

      // Insert new records
      const recordsToInsert = students.map(student => ({
        student_id: student.id,
        class_id: classData.id,
        pedagogus_id: userData.user.id,
        attendance_date: selectedDate,
        present: editingAttendance[student.id] || false,
        notes: editingNotes[student.id] || null
      }));

      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert(recordsToInsert);

      if (insertError) throw insertError;

      addNotification('success', 'Jelenlét sikeresen mentve!');
      setIsEditMode(false);
      await fetchStudentsAndAttendance();

    } catch (error) {
      console.error('Error saving attendance:', error);
      addNotification('error', 'Hiba a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setEditingAttendance(prev => ({
      ...prev,
      [studentId]: present
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setEditingNotes(prev => ({
      ...prev,
      [studentId]: notes
    }));
  };

  // Create students with attendance data
  const studentsWithAttendance: StudentWithAttendance[] = students.map(student => {
    const record = attendanceRecords.find(r => r.student_id === student.id);
    return {
      ...student,
      present: editingAttendance[student.id] || false,
      notes: editingNotes[student.id] || '',
      hasRecord: !!record,
      recordId: record?.id
    };
  });

  // Calculate statistics
  const totalStudents = students.length;
  const presentStudents = studentsWithAttendance.filter(s => s.present).length;
  const absentStudents = totalStudents - presentStudents;
  const attendanceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;

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
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Szerkesztés
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Mentés...' : 'Mentés'}
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    fetchStudentsAndAttendance();
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Mégse
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Betöltés...</p>
            </div>
          ) : (
            <>
              {/* Statistics */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{totalStudents}</div>
                    <div className="text-sm text-blue-700 font-medium">Összes gyerek</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{presentStudents}</div>
                    <div className="text-sm text-green-700 font-medium">Jelen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{absentStudents}</div>
                    <div className="text-sm text-red-700 font-medium">Hiányzik</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{attendanceRate.toFixed(1)}%</div>
                    <div className="text-sm text-purple-700 font-medium">Jelenlét arány</div>
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Gyerekek ({totalStudents})
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {studentsWithAttendance.map((student) => (
                    <div key={student.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-lg font-medium text-gray-900">
                              {student.name}
                            </div>
                          </div>
                        </div>
                        
                        {isEditMode ? (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleAttendanceChange(student.id, true)}
                              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                                student.present
                                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-green-50'
                              }`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Jelen
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, false)}
                              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                                !student.present
                                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-red-50'
                              }`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Hiányzik
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            {student.hasRecord ? (
                              student.present ? (
                                <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  <span className="font-semibold">Jelen</span>
                                </div>
                              ) : (
                                <div className="flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full">
                                  <XCircle className="h-5 w-5 mr-2" />
                                  <span className="font-semibold">Hiányzik</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center bg-gray-100 text-gray-600 px-4 py-2 rounded-full">
                                <span className="font-medium">Nincs rögzítve</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Notes */}
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        {isEditMode ? (
                          <input
                            type="text"
                            value={student.notes}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            placeholder="Megjegyzés (opcionális)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <span className="text-gray-600 text-sm">
                            {student.notes || 'Nincs megjegyzés'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};