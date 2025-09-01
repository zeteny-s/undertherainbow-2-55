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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="glass-card rounded-xl p-8 shadow-glass">
          <div className="w-8 h-8 border-2 border-foreground-subtle border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="glass-card rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-glass mobile-modal">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-DEFAULT bg-gradient-glass gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="heading-2 text-foreground flex items-center gap-2 sm:gap-3 truncate">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="truncate">{classData.name}</span>
            </h2>
            <p className="text-foreground-muted mt-1 mobile-text-xs sm:text-sm">
              {new Date(selectedDate).toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className="px-2 py-1 mobile-text-xs sm:text-sm font-medium bg-primary/10 text-primary rounded-md">
              {classData.house}
            </span>
            <button
              onClick={onClose}
              className="glass-button p-2 hover:bg-surface-hover rounded-lg transition-colors mobile-touch-target"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-foreground-subtle" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)] overflow-y-auto scrollbar-custom mobile-modal-content">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 glass-card rounded-xl">
              <div className="text-lg sm:text-2xl font-bold text-foreground">{totalStudents}</div>
              <div className="mobile-text-xs sm:text-sm text-foreground-muted mt-1">Összes</div>
            </div>
            <div className="text-center p-3 sm:p-4 glass-card rounded-xl border border-success/20">
              <div className="text-lg sm:text-2xl font-bold text-success">{presentCount}</div>
              <div className="mobile-text-xs sm:text-sm text-success/80 mt-1">Jelen</div>
            </div>
            <div className="text-center p-3 sm:p-4 glass-card rounded-xl border border-error/20">
              <div className="text-lg sm:text-2xl font-bold text-error">{absentCount}</div>
              <div className="mobile-text-xs sm:text-sm text-error/80 mt-1">Hiányzik</div>
            </div>
          </div>

          {/* Existing Records Notice */}
          {existingRecords.length > 0 && (
            <div className="mb-6 p-4 glass-card border border-warning/20 rounded-xl">
              <p className="mobile-text-sm text-foreground-muted">
                Erre a napra már van jelenlét rögzítve. A módosítások felülírják a korábbi bejegyzéseket.
              </p>
            </div>
          )}

          {/* Students List */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {students.map((student) => (
              <div 
                key={student.id} 
                className="glass-card rounded-xl p-3 sm:p-4 hover:border-border-hover transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 sm:mb-3">
                  <h3 className="font-medium text-foreground flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <span className="truncate mobile-text-sm sm:text-base">{student.name}</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:flex gap-2">
                    <button
                      onClick={() => handleAttendanceToggle(student.id, true)}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border transition-colors mobile-text-xs sm:text-sm mobile-touch-target ${
                        attendance[student.id]
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'glass-button border-DEFAULT text-foreground-muted hover:bg-success/5 hover:border-success/20'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Jelen</span>
                      <span className="sm:hidden">✓</span>
                    </button>
                    
                    <button
                      onClick={() => handleAttendanceToggle(student.id, false)}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border transition-colors mobile-text-xs sm:text-sm mobile-touch-target ${
                        !attendance[student.id]
                          ? 'bg-error/10 border-error/30 text-error'
                          : 'glass-button border-DEFAULT text-foreground-muted hover:bg-error/5 hover:border-error/20'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Hiányzik</span>
                      <span className="sm:hidden">✗</span>
                    </button>
                  </div>
                </div>

                {!attendance[student.id] && (
                  <div className="mt-4 p-3 glass-card rounded-lg">
                    <label className="block mobile-text-sm text-foreground-muted mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Megjegyzés (opcionális)
                    </label>
                    <input
                      type="text"
                      value={notes[student.id] || ''}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      placeholder="Hiányzás oka..."
                      className="w-full px-3 py-2 border border-DEFAULT rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors mobile-text-sm bg-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {students.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-foreground-subtle" />
              </div>
              <h3 className="heading-3 text-foreground mb-2">Nincsenek gyerekek</h3>
              <p className="text-foreground-muted body-text">
                Kérje meg az adminisztrátort, hogy adjon hozzá gyerekeket ehhez az osztályhoz.
              </p>
            </div>
          )}

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <div className="mb-6 p-4 glass-card border border-warning/20 rounded-xl">
              <p className="mobile-text-sm text-foreground-muted">
                Nem mentett módosításai vannak. Ne felejtse el menteni a jelenlétet!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6 border-t border-DEFAULT bg-gradient-glass">
          <button
            onClick={onClose}
            className="glass-button px-6 py-3 font-medium mobile-touch-target order-2 sm:order-1"
          >
            Bezárás
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || students.length === 0}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target order-1 sm:order-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Mentés...' : 'Jelenlét mentése'}
          </button>
        </div>
      </div>
    </div>
  );
};
