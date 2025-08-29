import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, MessageSquare, Save } from 'lucide-react';
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
  present: boolean;
  notes?: string;
}

interface AttendanceFormProps {
  classData: Class;
  todayAttendance: AttendanceRecord[];
  onSubmit: (attendance: Record<string, boolean>, notes: Record<string, string>) => Promise<void>;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({
  classData,
  todayAttendance,
  onSubmit
}) => {
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { addNotification } = useNotifications();

  // Initialize attendance state from existing records or default to present
  useEffect(() => {
    const initialAttendance: Record<string, boolean> = {};
    const initialNotes: Record<string, string> = {};

    classData.students?.forEach(student => {
      const record = todayAttendance.find(r => r.student_id === student.id);
      initialAttendance[student.id] = record ? record.present : true;
      initialNotes[student.id] = record?.notes || '';
    });

    setAttendance(initialAttendance);
    setNotes(initialNotes);
    setHasChanges(false);
  }, [classData, todayAttendance]);

  const handleAttendanceToggle = (studentId: string, present: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }));
    setHasChanges(true);
  };

  const handleNotesChange = (studentId: string, note: string) => {
    setNotes(prev => ({ ...prev, [studentId]: note }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(attendance, notes);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      addNotification('error', 'Hiba a jelenlét mentésekor');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = Object.values(attendance).filter(p => !p).length;

  const today = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Jelenlét rögzítése - {classData.name}
          </h2>
          <p className="text-gray-600">{today}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full mr-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              {presentCount} jelen
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full">
              <XCircle className="h-3 w-3 mr-1" />
              {absentCount} hiányzik
            </span>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={saving || !hasChanges}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Mentés...' : 'Jelenlét mentése'}
          </button>
        </div>
      </div>

      {todayAttendance.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            A mai napra már van jelenlét rögzítve. A módosítások felülírják a korábbi bejegyzéseket.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {classData.students?.map((student) => (
          <div key={student.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{student.name}</h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAttendanceToggle(student.id, true)}
                  className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                    attendance[student.id]
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-green-50'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Jelen
                </button>
                
                <button
                  onClick={() => handleAttendanceToggle(student.id, false)}
                  className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                    !attendance[student.id]
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-red-50'
                  }`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Hiányzik
                </button>
              </div>
            </div>

            {!attendance[student.id] && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-2">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Megjegyzés (opcionális)
                </label>
                <input
                  type="text"
                  value={notes[student.id] || ''}
                  onChange={(e) => handleNotesChange(student.id, e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {(!classData.students || classData.students.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nincsenek gyerekek</h3>
          <p className="text-gray-600">
            Kérje meg az adminisztrátort, hogy adjon hozzá gyerekeket ehhez az osztályhoz.
          </p>
        </div>
      )}

      {hasChanges && (
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Nem mentett módosításai vannak. Ne felejtse el menteni a jelenlétet!
          </p>
        </div>
      )}
    </div>
  );
};