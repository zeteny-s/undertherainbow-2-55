import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, CheckCircle, XCircle, Search } from 'lucide-react';
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

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  present: boolean;
  notes: string | null;
  student_id: string;
  class_id: string;
  students: {
    name: string;
  };
  classes: {
    name: string;
    house: string;
  };
}

interface ClassSummary {
  class_id: string;
  class_name: string;
  house: string;
  total_students: number;
  present_students: number;
  absent_students: number;
  attendance_rate: number;
}

export const AttendanceReportsModal: React.FC<AttendanceReportsModalProps> = ({ onClose }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classSummary, setClassSummary] = useState<ClassSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendanceData();
    }
  }, [selectedDate, selectedClass]);

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

  const fetchAttendanceData = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      // Fetch attendance records for the selected date and class
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select(`
          id,
          attendance_date,
          present,
          notes,
          student_id,
          class_id,
          students!inner (
            name
          ),
          classes!inner (
            name,
            house
          )
        `)
        .eq('attendance_date', selectedDate)
        .eq('class_id', selectedClass)
        .order('students(name)', { ascending: true });

      if (recordsError) throw recordsError;

      setAttendanceRecords(records || []);

      // Calculate class summary for the selected class
      if (records && records.length > 0) {
        const summary: ClassSummary = {
          class_id: selectedClass,
          class_name: records[0].classes.name,
          house: records[0].classes.house,
          total_students: records.length,
          present_students: records.filter(r => r.present).length,
          absent_students: records.filter(r => !r.present).length,
          attendance_rate: 0
        };
        
        summary.attendance_rate = summary.total_students > 0 
          ? (summary.present_students / summary.total_students) * 100 
          : 0;

        setClassSummary(summary);
      } else {
        // If no records, create empty summary for selected class
        const selectedClassData = classes.find(c => c.id === selectedClass);
        if (selectedClassData) {
          setClassSummary({
            class_id: selectedClass,
            class_name: selectedClassData.name,
            house: selectedClassData.house,
            total_students: 0,
            present_students: 0,
            absent_students: 0,
            attendance_rate: 0
          });
        } else {
          setClassSummary(null);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      addNotification('error', 'Hiba a jelenlét adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = attendanceRecords.filter(record =>
    record.students.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Jelenlét riportok
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
                Osztály kiválasztása
              </label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Válasszon osztályt</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {!selectedClass ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Válasszon osztályt</h3>
              <p className="text-gray-600">Kérjük válasszon egy osztályt a jelenlét riportok megtekintéséhez.</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Betöltés...</p>
            </div>
          ) : (
            <>
              {/* Class Summary */}
              {classSummary && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {classSummary.class_name} - {selectedDate}
                  </h3>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-semibold text-blue-900">{classSummary.class_name}</h4>
                      <span className="px-3 py-1 text-sm font-medium bg-blue-200 text-blue-800 rounded-full">
                        {classSummary.house}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{classSummary.total_students}</div>
                        <div className="text-sm text-blue-700">Összes gyerek</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{classSummary.present_students}</div>
                        <div className="text-sm text-green-700">Jelen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{classSummary.absent_students}</div>
                        <div className="text-sm text-red-700">Hiányzik</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{classSummary.attendance_rate.toFixed(1)}%</div>
                        <div className="text-sm text-purple-700">Jelenlét</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Records */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Részletes jelenlét ({filteredRecords.length} gyerek)
                </h3>
                
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="text-lg font-medium text-gray-900 mb-2">Nincs jelenlét adat</div>
                    <div>Nincs rögzített jelenlét erre a napra és osztályra.</div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Gyerek neve
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Jelenlét
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Megjegyzés
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {record.students.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {record.present ? (
                                    <>
                                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                      <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        Jelen
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                      <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                        Hiányzik
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {record.notes || '-'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};