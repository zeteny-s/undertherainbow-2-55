import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Users, Eye, ChevronRight } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { ClassAttendanceModal } from './ClassAttendanceModal';

interface Class {
  id: string;
  name: string;
  house: string;
  student_count: number;
}

interface MissingAttendanceAlertState {
  showClassModal: boolean;
  selectedClassId: string | null;
}

export const ModernMissingAlert: React.FC = () => {
  const [missingClasses, setMissingClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [modalState, setModalState] = useState<MissingAttendanceAlertState>({
    showClassModal: false,
    selectedClassId: null,
  });

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

      const classesWithAttendance = new Set(
        attendanceData?.map((record) => record.class_id) || []
      );

      // Filter classes that don't have attendance records for the selected date
      const classesWithoutAttendance = classesData.filter(
        (cls) => !classesWithAttendance.has(cls.id)
      );

      // Get student counts for missing classes
      const classesWithCounts = await Promise.all(
        classesWithoutAttendance.map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          return {
            ...cls,
            student_count: count || 0,
          };
        })
      );

      // Only show classes that have students
      setMissingClasses(classesWithCounts.filter((cls) => cls.student_count > 0));
    } catch (error) {
      console.error('Error checking missing attendance:', error);
      setMissingClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClass = (classId: string) => {
    setModalState({
      showClassModal: true,
      selectedClassId: classId,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      showClassModal: false,
      selectedClassId: null,
    });
    // Refresh the missing classes data after closing modal
    checkMissingAttendance();
  };

  if (loading) {
    return (
      <div className="bg-surface-elevated border border-DEFAULT rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-foreground-subtle/20 rounded animate-pulse"></div>
          <div className="h-4 bg-foreground-subtle/20 rounded flex-1"></div>
        </div>
      </div>
    );
  }

  if (missingClasses.length === 0) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Minden osztály rögzítette a jelenlétet
            </h3>
            <p className="text-sm text-foreground-muted mt-1">
              {new Date(selectedDate).toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-warning/5 border border-warning/20 rounded-xl p-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="font-medium text-foreground">
                Hiányzó jelenléti adatok
              </h3>
              <p className="text-sm text-foreground-muted mt-1">
                {missingClasses.length} osztály még nem rögzítette a jelenlétet
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Calendar className="w-4 h-4 text-foreground-subtle" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm border border-DEFAULT rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {missingClasses.map((cls, index) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 bg-white border border-DEFAULT rounded-lg hover:border-border-hover transition-all duration-200 hover-lift animate-slide-in-right"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{cls.name}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                        {cls.house}
                      </span>
                      <span className="text-sm text-foreground-muted">
                        {cls.student_count} gyerek
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleViewClass(cls.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-all duration-200 hover-lift"
                >
                  <Eye className="w-4 h-4" />
                  Rögzítés
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Attendance Modal */}
      {modalState.showClassModal && modalState.selectedClassId && (
        <ClassAttendanceModal
          onClose={handleCloseModal}
          classId={modalState.selectedClassId}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};