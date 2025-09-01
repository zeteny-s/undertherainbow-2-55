import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, CheckCircle, XCircle, MessageSquare, Save, User } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-xl p-8 shadow-xl animate-scale-in">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-foreground-subtle border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-foreground-muted text-center">Betöltés...</p>
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-DEFAULT bg-surface">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              {classData.name}
            </h2>
            <p className="text-foreground-muted mt-1 text-sm">
              {new Date(selectedDate).toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-md">
              {classData.house}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-foreground-subtle" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto scrollbar-custom">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-surface-elevated border border-DEFAULT rounded-xl">
              <div className="text-2xl font-semibold text-foreground">{totalStudents}</div>
              <div className="text-sm text-foreground-muted mt-1">Összes gyerek</div>
            </div>
            <div className="text-center p-4 bg-success/5 border border-success/20 rounded-xl">
              <div className="text-2xl font-semibold text-success">{presentCount}</div>
              <div className="text-sm text-success/80 mt-1">Jelen</div>
            </div>
            <div className="text-center p-4 bg-error/5 border border-error/20 rounded-xl">
              <div className="text-2xl font-semibold text-error">{absentCount}</div>
              <div className="text-sm text-error/80 mt-1">Hiányzik</div>
            </div>
          </div>

          {/* Existing Records Notice */}
          {existingRecords.length > 0 && (
            <div className="mb-6 p-4 bg-warning/5 border border-warning/20 rounded-xl">
              <p className="text-sm text-foreground-muted">
                Erre a napra már van jelenlét rögzítve. A módosítások felülírják a korábbi bejegyzéseket.
              </p>
            </div>
          )}

          {/* Students List */}
          <div className="space-y-4 mb-6">
            {students.map((student, index) => (
              <div 
                key={student.id} 
                className="border border-DEFAULT rounded-xl p-4 hover:border-border-hover transition-all duration-200 animate-slide-in-right"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-foreground flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    {student.name}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAttendanceToggle(student.id, true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                        attendance[student.id]
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-white border-DEFAULT text-foreground-muted hover:bg-success/5 hover:border-success/20'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Jelen
                    </button>
                    
                    <button
                      onClick={() => handleAttendanceToggle(student.id, false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                        !attendance[student.id]
                          ? 'bg-error/10 border-error/30 text-error'
                          : 'bg-white border-DEFAULT text-foreground-muted hover:bg-error/5 hover:border-error/20'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Hiányzik
                    </button>
                  </div>
                </div>

                {!attendance[student.id] && (
                  <div className="mt-4 p-3 bg-surface rounded-lg">
                    <label className="block text-sm text-foreground-muted mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Megjegyzés (opcionális)
                    </label>
                    <input
                      type="text"
                      value={notes[student.id] || ''}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      placeholder="Hiányzás oka..."
                      className="w-full px-3 py-2 border border-DEFAULT rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm bg-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {students.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-foreground-subtle" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nincsenek gyerekek</h3>
              <p className="text-foreground-muted">
                Kérje meg az adminisztrátort, hogy adjon hozzá gyerekeket ehhez az osztályhoz.
              </p>
            </div>
          )}

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <div className="mb-6 p-4 bg-warning/5 border border-warning/20 rounded-xl animate-bounce-in">
              <p className="text-sm text-foreground-muted">
                Nem mentett módosításai vannak. Ne felejtse el menteni a jelenlétet!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-DEFAULT bg-surface">
          <button
            onClick={onClose}
            className="px-6 py-3 text-foreground-muted bg-white border border-DEFAULT rounded-lg hover:bg-surface-hover transition-all duration-200 font-medium"
          >
            Bezárás
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || students.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium hover-lift"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Mentés...' : 'Jelenlét mentése'}
          </button>
        </div>
      </div>
    </div>
  );
};
