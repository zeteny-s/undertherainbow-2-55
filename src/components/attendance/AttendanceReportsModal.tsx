import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, CheckCircle, XCircle, Search } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';

interface AttendanceReportsModalProps {
  onClose: () => void;
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
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Fetch attendance records for the selected date
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
        .order('classes(name)', { ascending: true });

      if (recordsError) throw recordsError;

      setAttendanceRecords(records || []);

      // Calculate class summaries
      const summaries: Record<string, ClassSummary> = {};
      
      records?.forEach(record => {
        const classId = record.class_id;
        if (!summaries[classId]) {
          summaries[classId] = {
            class_id: classId,
            class_name: record.classes.name,
            house: record.classes.house,
            total_students: 0,
            present_students: 0,
            absent_students: 0,
            attendance_rate: 0
          };
        }
        
        summaries[classId].total_students++;
        if (record.present) {
          summaries[classId].present_students++;
        } else {
          summaries[classId].absent_students++;
        }
      });

      // Calculate attendance rates
      Object.values(summaries).forEach(summary => {
        summary.attendance_rate = summary.total_students > 0 
          ? (summary.present_students / summary.total_students) * 100 
          : 0;
      });

      setClassSummaries(Object.values(summaries));
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      addNotification('error', 'Hiba a jelenlét adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = attendanceRecords.filter(record =>
    record.students.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.classes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.classes.house.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSummaries = classSummaries.filter(summary =>
    summary.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.house.toLowerCase().includes(searchTerm.toLowerCase())
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
          {/* Date and Search Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
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
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Keresés
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Keresés gyerek vagy osztály neve alapján..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Betöltés...</p>
            </div>
          ) : (
            <>
              {/* Class Summaries */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Osztály összesítők - {selectedDate}
                </h3>
                
                {filteredSummaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <div>Nincs jelenlét adat erre a napra</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {filteredSummaries.map((summary) => (
                      <div key={summary.class_id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{summary.class_name}</h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {summary.house}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Összes gyerek:</span>
                            <span className="font-medium">{summary.total_students}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Jelen:</span>
                            <span className="font-medium text-green-600">{summary.present_students}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Hiányzik:</span>
                            <span className="font-medium text-red-600">{summary.absent_students}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Jelenlét:</span>
                              <span className="font-semibold text-blue-600">
                                {summary.attendance_rate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Records */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Részletes jelenlét ({filteredRecords.length} rekord)
                </h3>
                
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div>Nincs találat a keresési feltételeknek</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gyerek neve
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Osztály
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ház
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
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {record.students.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{record.classes.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {record.classes.house}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {record.present ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                    <span className="text-sm font-medium text-green-600">Jelen</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                    <span className="text-sm font-medium text-red-600">Hiányzik</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {record.notes || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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