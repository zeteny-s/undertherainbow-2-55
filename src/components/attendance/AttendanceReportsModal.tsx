import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, CheckCircle, XCircle, Search, BookOpen } from 'lucide-react';
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

export const AttendanceReportsModal: React.FC<AttendanceReportsModalProps> = ({ onClose }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-3 text-blue-600" />
            Jelenlét riportok
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
                Osztály kiválasztása *
              </label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              >
                <option value="">Válasszon osztályt...</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.house}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Dátum kiválasztása
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Keresés gyerek neve alapján
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Keresés..."
                  disabled={!selectedClass}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          {!selectedClass ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Válasszon osztályt</h3>
              <p className="text-gray-600">
                Kérjük válasszon egy osztályt a jelenlét riportok megtekintéséhez.
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Betöltés...</p>
            </div>
          ) : (
            <>
              {/* Class Summary */}
              {selectedClassData && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-blue-900">{selectedClassData.name}</h3>
                      <p className="text-blue-700">
                        {new Date(selectedDate).toLocaleDateString('hu-HU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </p>
                    </div>
                    <span className="px-4 py-2 text-sm font-bold bg-blue-200 text-blue-800 rounded-full">
                      {selectedClassData.house}
                    </span>
                  </div>
                  
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
              )}

              {/* Students List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Gyerekek ({filteredStudents.length})
                  </h3>
                </div>
                
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'Nincs találat' : 'Nincsenek gyerekek'}
                    </div>
                    <div className="text-gray-600">
                      {searchTerm 
                        ? 'Próbáljon meg más keresési kifejezést használni.'
                        : 'Nincsenek gyerekek ebben az osztályban.'
                      }
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-lg font-medium text-gray-900">
                                {student.name}
                              </div>
                              {student.notes && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Megjegyzés: {student.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
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