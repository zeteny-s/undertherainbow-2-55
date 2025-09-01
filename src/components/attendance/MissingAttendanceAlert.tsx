import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Users, Eye } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';

interface Class {
  id: string;
  name: string;
  house: string;
  student_count: number;
}

interface MissingAttendanceAlertProps {
  onViewClass?: (classId: string) => void;
}

export const MissingAttendanceAlert: React.FC<MissingAttendanceAlertProps> = ({ onViewClass }) => {
  const [missingClasses, setMissingClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    checkMissingAttendance();
  }, [selectedDate]);

  const checkMissingAttendance = async () => {
    setLoading(true);
    try {
      // Get all classes with student counts
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, house')
        .order('name');

      if (classesError) throw classesError;

      if (!classesData) {
        setMissingClasses([]);
        return;
      }

      // Get classes with attendance records for the selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('class_id')
        .eq('attendance_date', selectedDate);

      if (attendanceError) throw attendanceError;

      const classesWithAttendance = new Set(attendanceData?.map(record => record.class_id) || []);

      // Filter classes that don't have attendance records for the selected date
      const classesWithoutAttendance = classesData.filter(cls => !classesWithAttendance.has(cls.id));

      // Get student counts for missing classes
      const classesWithCounts = await Promise.all(
        classesWithoutAttendance.map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          return {
            ...cls,
            student_count: count || 0
          };
        })
      );

      // Only show classes that have students
      setMissingClasses(classesWithCounts.filter(cls => cls.student_count > 0));

    } catch (error) {
      console.error('Error checking missing attendance:', error);
      setMissingClasses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
          <span className="text-yellow-800">Hiányzó jelenléti adatok ellenőrzése...</span>
        </div>
      </div>
    );
  }

  if (missingClasses.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Minden osztály rögzítette a jelenlétet
            </h3>
            <p className="text-sm text-green-700 mt-1">
              {new Date(selectedDate).toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                Hiányzó jelenléti adatok
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {missingClasses.length} osztály még nem rögzítette a jelenlétet
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm border border-yellow-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {missingClasses.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between bg-white border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{cls.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        {cls.house}
                      </span>
                      <span>{cls.student_count} gyerek</span>
                    </div>
                  </div>
                </div>
                
                {onViewClass && (
                  <button
                    onClick={() => onViewClass(cls.id)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Részletek
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};