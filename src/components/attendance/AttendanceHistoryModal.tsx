import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, XCircle, Edit, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

interface Student {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  house: string;
  students: Student[];
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  attendance_date: string;
  present: boolean;
  notes?: string | null;
  students?: { name: string };
}

interface AttendanceHistoryModalProps {
  classData: Class;
  onClose: () => void;
}

export const AttendanceHistoryModal: React.FC<AttendanceHistoryModalProps> = ({
  classData,
  onClose
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [editingDate, setEditingDate] = useState<string>('');
  const [editingAttendance, setEditingAttendance] = useState<Record<string, boolean>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchAttendanceHistory();
  }, [classData.id]);

  const fetchAttendanceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          students (name)
        `)
        .eq('class_id', classData.id)
        .order('attendance_date', { ascending: false })
        .order('students(name)');

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      addNotification('error', 'Hiba a jelenlét történet betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  // Get unique dates
  const uniqueDates = Array.from(
    new Set(attendanceRecords.map(r => r.attendance_date))
  ).sort((a, b) => b.localeCompare(a));

  const getRecordsForDate = (date: string) => {
    return attendanceRecords.filter(r => r.attendance_date === date);
  };

  const handleEditDate = (date: string) => {
    const dateRecords = getRecordsForDate(date);
    const attendance: Record<string, boolean> = {};
    const notes: Record<string, string> = {};

    // Initialize with existing records
    dateRecords.forEach(record => {
      attendance[record.student_id] = record.present;
      notes[record.student_id] = record.notes || '';
    });

    // Fill in missing students (they would be marked as present by default)
    classData.students?.forEach(student => {
      if (!(student.id in attendance)) {
        attendance[student.id] = true;
        notes[student.id] = '';
      }
    });

    setEditingDate(date);
    setEditingAttendance(attendance);
    setEditingNotes(notes);
  };

  const handleSaveEdit = async () => {
    if (!editingDate || !user) return;

    setSaving(true);
    try {
      // Delete existing records for this date
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('class_id', classData.id)
        .eq('attendance_date', editingDate);

      if (deleteError) throw deleteError;

      // Insert updated records
      const records = Object.entries(editingAttendance).map(([studentId, present]) => ({
        student_id: studentId,
        class_id: classData.id,
        pedagogus_id: user.id,
        attendance_date: editingDate,
        present,
        notes: editingNotes[studentId] || null
      }));

      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert(records);

      if (insertError) throw insertError;

      setEditingDate('');
      fetchAttendanceHistory();
      addNotification('success', 'Jelenlét sikeresen módosítva!');
    } catch (error) {
      console.error('Error updating attendance:', error);
      addNotification('error', 'Hiba a jelenlét módosításakor');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDate = async (date: string) => {
    if (!confirm(`Biztosan törölni szeretné a ${new Date(date).toLocaleDateString('hu-HU')} napra vonatkozó jelenlét adatokat?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('class_id', classData.id)
        .eq('attendance_date', date);

      if (error) throw error;

      fetchAttendanceHistory();
      addNotification('success', 'Jelenlét sikeresen törölve!');
    } catch (error) {
      console.error('Error deleting attendance:', error);
      addNotification('error', 'Hiba a jelenlét törlésekor');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Jelenlét történet - {classData.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {uniqueDates.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nincs jelenlét rögzítve</h3>
              <p className="text-gray-600">Még nincsenek korábbi jelenlét bejegyzések ennél az osztálynál.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {uniqueDates.map(date => {
                const dateRecords = getRecordsForDate(date);
                const presentCount = dateRecords.filter(r => r.present).length;
                const absentCount = dateRecords.filter(r => !r.present).length;
                const isEditing = editingDate === date;

                return (
                  <div key={date} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold text-gray-900">
                          {new Date(date).toLocaleDateString('hu-HU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {presentCount} jelen
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            <XCircle className="h-3 w-3 mr-1" />
                            {absentCount} hiányzik
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => setEditingDate('')}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded text-sm"
                            >
                              Mégse
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={saving}
                              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              {saving ? 'Mentés...' : 'Mentés'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditDate(date)}
                              className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                              title="Szerkesztés"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDate(date)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Törlés"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          {classData.students?.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 border rounded">
                              <span className="font-medium">{student.name}</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setEditingAttendance(prev => ({ ...prev, [student.id]: true }))}
                                  className={`px-3 py-1 rounded text-sm ${
                                    editingAttendance[student.id] 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                  }`}
                                >
                                  Jelen
                                </button>
                                <button
                                  onClick={() => setEditingAttendance(prev => ({ ...prev, [student.id]: false }))}
                                  className={`px-3 py-1 rounded text-sm ${
                                    !editingAttendance[student.id] 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                  }`}
                                >
                                  Hiányzik
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {classData.students?.map(student => {
                            const record = dateRecords.find(r => r.student_id === student.id);
                            const isPresent = record ? record.present : true; // Default to present if no record
                            
                            return (
                              <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                                <span className="text-sm">{student.name}</span>
                                <div className="flex items-center">
                                  {isPresent ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                      {record?.notes && (
                                        <span className="text-xs text-gray-500" title={record.notes}>
                                          💬
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};