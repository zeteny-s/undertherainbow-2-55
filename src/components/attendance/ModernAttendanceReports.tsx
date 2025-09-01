import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, CheckCircle, XCircle, Search, BookOpen, ChevronDown } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';

interface AttendanceReportsModalProps {
  onClose: () => void;
}

interface Class {
  id: string;
  name: string;
  house: string;
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
  students: {
    name: string;
  };
}

export const ModernAttendanceReports: React.FC<AttendanceReportsModalProps> = ({ onClose }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Fetch all classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students and attendance when class or date changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudentsAndAttendance();
    } else {
      setStudents([]);
      setAttendanceRecords([]);
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, house')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
      
      // Auto-select first class if available
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      addNotification('error', 'Hiba az osztályok betöltésekor');
    }
  };

  const fetchStudentsAndAttendance = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      // Fetch all students in the selected class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('class_id', selectedClass)
        .order('name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch attendance records for the selected class and date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          id,
          present,
          notes,
          student_id,
          students!inner (
            name
          )
        `)
        .eq('class_id', selectedClass)
        .eq('attendance_date', selectedDate);

      if (attendanceError) throw attendanceError;
      setAttendanceRecords(attendanceData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      addNotification('error', 'Hiba az adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  // Get the selected class data
  const selectedClassData = classes.find(c => c.id === selectedClass);

  // Create a list of all students with their attendance status
  const studentsWithAttendance = students.map(student => {
    const attendanceRecord = attendanceRecords.find(record => record.student_id === student.id);
    return {
      id: student.id,
      name: student.name,
      present: attendanceRecord?.present || false,
      notes: attendanceRecord?.notes || null,
      hasRecord: !!attendanceRecord
    };
  });

  // Filter students based on search term
  const filteredStudents = studentsWithAttendance.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalStudents = studentsWithAttendance.length;
  const recordedStudents = studentsWithAttendance.filter(s => s.hasRecord).length;
  const presentStudents = studentsWithAttendance.filter(s => s.hasRecord && s.present).length;
  const absentStudents = studentsWithAttendance.filter(s => s.hasRecord && !s.present).length;
  const attendanceRate = recordedStudents > 0 ? (presentStudents / recordedStudents) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-DEFAULT bg-surface">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              Jelenlét riportok
            </h2>
            <p className="text-foreground-muted text-sm mt-1">
              Részletes jelenléti adatok megtekintése
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground-subtle" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto scrollbar-custom">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-foreground mb-2">
                Osztály kiválasztása
              </label>
              <div className="relative">
                <select
                  id="class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 border border-DEFAULT rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-foreground font-medium appearance-none"
                >
                  <option value="">Válasszon osztályt...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.house}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-subtle pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                Dátum kiválasztása
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-DEFAULT rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              />
            </div>
            
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                Keresés gyerek neve alapján
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-subtle" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Keresés..."
                  disabled={!selectedClass}
                  className="w-full pl-10 pr-4 py-3 border border-DEFAULT rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface disabled:text-foreground-muted"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          {!selectedClass ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-foreground-subtle" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Válasszon osztályt</h3>
              <p className="text-foreground-muted">
                Kérjük válasszon egy osztályt a jelenlét riportok megtekintéséhez.
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-12 animate-pulse">
              <div className="w-12 h-12 border-2 border-foreground-subtle border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-foreground-muted">Betöltés...</p>
            </div>
          ) : (
            <>
              {/* Class Summary */}
              {selectedClassData && (
                <div className="bg-surface-elevated border border-DEFAULT rounded-xl p-6 mb-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{selectedClassData.name}</h3>
                      <p className="text-foreground-muted text-sm">
                        {new Date(selectedDate).toLocaleDateString('hu-HU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-md">
                      {selectedClassData.house}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white border border-DEFAULT rounded-lg">
                      <div className="text-2xl font-semibold text-foreground">{totalStudents}</div>
                      <div className="text-sm text-foreground-muted">Összes gyerek</div>
                    </div>
                    <div className="text-center p-3 bg-success/5 border border-success/20 rounded-lg">
                      <div className="text-2xl font-semibold text-success">{presentStudents}</div>
                      <div className="text-sm text-success/80">Jelen</div>
                    </div>
                    <div className="text-center p-3 bg-error/5 border border-error/20 rounded-lg">
                      <div className="text-2xl font-semibold text-error">{absentStudents}</div>
                      <div className="text-sm text-error/80">Hiányzik</div>
                    </div>
                    <div className="text-center p-3 bg-warning/5 border border-warning/20 rounded-lg">
                      <div className="text-2xl font-semibold text-warning">{attendanceRate.toFixed(1)}%</div>
                      <div className="text-sm text-warning/80">Jelenlét arány</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Students List */}
              <div className="bg-surface-elevated border border-DEFAULT rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-DEFAULT bg-surface">
                  <h3 className="font-medium text-foreground flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    Gyerekek ({filteredStudents.length})
                  </h3>
                </div>
                
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                    <div className="font-medium text-foreground mb-2">
                      {searchTerm ? 'Nincs találat' : 'Nincsenek gyerekek'}
                    </div>
                    <div className="text-foreground-muted text-sm">
                      {searchTerm 
                        ? 'Próbáljon meg más keresési kifejezést használni.'
                        : 'Nincsenek gyerekek ebben az osztályban.'
                      }
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredStudents.map((student, index) => (
                      <div 
                        key={student.id} 
                        className="px-6 py-4 hover:bg-surface-hover transition-colors animate-slide-in-right"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {student.name}
                              </div>
                              {student.notes && (
                                <div className="text-sm text-foreground-muted mt-1">
                                  Megjegyzés: {student.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {student.hasRecord ? (
                              student.present ? (
                                <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-lg border border-success/20">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="font-medium text-sm">Jelen</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-error/10 text-error px-4 py-2 rounded-lg border border-error/20">
                                  <XCircle className="w-4 h-4" />
                                  <span className="font-medium text-sm">Hiányzik</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center gap-2 bg-surface text-foreground-muted px-4 py-2 rounded-lg border border-DEFAULT">
                                <span className="text-sm">Nincs rögzítve</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-DEFAULT bg-surface">
          <button
            onClick={onClose}
            className="px-6 py-3 text-foreground-muted bg-white border border-DEFAULT rounded-lg hover:bg-surface-hover transition-all duration-200 font-medium"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};