import React, { useState, useEffect } from 'react';
import { X, Edit, Plus, Trash2, Users, UserCheck } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';

interface ClassDetailModalProps {
  classData: {
    id: string;
    name: string;
    house: string;
    pedagogus_id: string | null;
    profiles?: {
      name: string | null;
      email: string | null;
    };
  };
  onClose: () => void;
  onUpdate: () => void;
}

interface Student {
  id: string;
  name: string;
}

interface PedagogusProfile {
  id: string;
  name: string | null;
  email: string | null;
}

interface AttendanceStats {
  totalDays: number;
  attendanceRate: number;
}

export const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
  classData,
  onClose,
  onUpdate
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [pedagogusProfiles, setPedagogusProfiles] = useState<PedagogusProfile[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, AttendanceStats>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [editingClass, setEditingClass] = useState({
    name: classData.name,
    house: classData.house,
    pedagogus_id: classData.pedagogus_id || ''
  });
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchStudents();
    fetchPedagogusProfiles();
    fetchAttendanceStats();
  }, [classData.id]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classData.id)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      addNotification('error', 'Hiba a diákok betöltésekor');
    }
  };

  const fetchPedagogusProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('profile_type', 'pedagogus')
        .order('name');

      if (error) throw error;
      setPedagogusProfiles(data || []);
    } catch (error) {
      console.error('Error fetching pedagogus profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('student_id, present')
        .eq('class_id', classData.id);

      if (error) throw error;

      const stats: Record<string, AttendanceStats> = {};
      
      students.forEach(student => {
        const studentRecords = data?.filter(r => r.student_id === student.id) || [];
        const totalDays = studentRecords.length;
        const presentDays = studentRecords.filter(r => r.present).length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        
        stats[student.id] = { totalDays, attendanceRate };
      });

      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return;

    try {
      const { error } = await supabase
        .from('students')
        .insert({
          name: newStudentName.trim(),
          class_id: classData.id
        });

      if (error) throw error;

      setNewStudentName('');
      fetchStudents();
      addNotification('success', 'Diák sikeresen hozzáadva');
    } catch (error) {
      console.error('Error adding student:', error);
      addNotification('error', 'Hiba a diák hozzáadásakor');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a diákot? Ez törli az összes korábbi jelenlét rekordját is.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      fetchStudents();
      addNotification('success', 'Diák sikeresen törölve');
    } catch (error) {
      console.error('Error deleting student:', error);
      addNotification('error', 'Hiba a diák törlésekor');
    }
  };

  const handleUpdateClass = async () => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name: editingClass.name.trim(),
          house: editingClass.house.trim(),
          pedagogus_id: editingClass.pedagogus_id || null
        })
        .eq('id', classData.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
      addNotification('success', 'Osztály sikeresen frissítve');
    } catch (error) {
      console.error('Error updating class:', error);
      addNotification('error', 'Hiba az osztály frissítésekor');
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Osztály részletei</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Class Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Osztály információk</h3>
            
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Osztály neve
                  </label>
                  <input
                    type="text"
                    value={editingClass.name}
                    onChange={(e) => setEditingClass(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ház neve
                  </label>
                  <input
                    type="text"
                    value={editingClass.house}
                    onChange={(e) => setEditingClass(prev => ({ ...prev, house: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pedagógus
                  </label>
                  <select
                    value={editingClass.pedagogus_id}
                    onChange={(e) => setEditingClass(prev => ({ ...prev, pedagogus_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Nincs hozzárendelve</option>
                    {pedagogusProfiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name || profile.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Mégse
                  </button>
                  <button
                    onClick={handleUpdateClass}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mentés
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Osztály neve</div>
                  <div className="font-semibold text-gray-900">{classData.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ház</div>
                  <div className="font-semibold text-gray-900">{classData.house}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pedagógus</div>
                  <div className="font-semibold text-gray-900">
                    {classData.profiles?.name || 'Nincs hozzárendelve'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Students Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Diákok ({students.length})
              </h3>
            </div>

            {/* Add Student */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Új diák neve"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
              />
              <button
                onClick={handleAddStudent}
                disabled={!newStudentName.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Hozzáadás
              </button>
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <UserCheck className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-600">
                        {attendanceStats[student.id] ? (
                          <>
                            {attendanceStats[student.id].totalDays} nap rögzítve • 
                            {attendanceStats[student.id].attendanceRate.toFixed(1)}% jelenlét
                          </>
                        ) : (
                          'Nincs jelenlét rögzítve'
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {students.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <div>Még nincsenek diákok ebben az osztályban</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};