import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';

interface CreateClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PedagogusProfile {
  id: string;
  name: string | null;
  email: string | null;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    house: '',
    pedagogus_id: ''
  });
  const [students, setStudents] = useState<string[]>(['']);
  const [pedagogusProfiles, setPedagogusProfiles] = useState<PedagogusProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchPedagogusProfiles();
  }, []);

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
      addNotification('error', 'Hiba a pedagógusok betöltésekor');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleStudentChange = (index: number, value: string) => {
    const newStudents = [...students];
    newStudents[index] = value;
    setStudents(newStudents);
  };

  const addStudent = () => {
    setStudents(prev => [...prev, '']);
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.house.trim()) {
      addNotification('error', 'Kérjük töltse ki az osztály nevét és házát');
      return;
    }

    const validStudents = students.filter(s => s.trim());
    if (validStudents.length === 0) {
      addNotification('error', 'Legalább egy gyereket meg kell adni');
      return;
    }

    setLoading(true);

    try {
      // Create the class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .insert({
          name: formData.name.trim(),
          house: formData.house.trim(),
          pedagogus_id: formData.pedagogus_id || null
        })
        .select()
        .single();

      if (classError) throw classError;

      // Add students to the class
      if (validStudents.length > 0) {
        const studentRecords = validStudents.map(studentName => ({
          name: studentName.trim(),
          class_id: classData.id
        }));

        const { error: studentsError } = await supabase
          .from('students')
          .insert(studentRecords);

        if (studentsError) throw studentsError;
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating class:', error);
      addNotification('error', 'Hiba az osztály létrehozásakor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Új osztály létrehozása</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Class Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Osztály neve *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder=""
                required
              />
            </div>

            <div>
              <label htmlFor="house" className="block text-sm font-medium text-gray-700 mb-2">
                Ház neve *
              </label>
              <select
                id="house"
                name="house"
                value={formData.house}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="">Válasszon házat</option>
                <option value="Torockó">Torockó</option>
                <option value="Feketerigó">Feketerigó</option>
                <option value="Levél">Levél</option>
              </select>
            </div>
          </div>

          {/* Pedagogus Assignment */}
          <div>
            <label htmlFor="pedagogus_id" className="block text-sm font-medium text-gray-700 mb-2">
              Pedagógus hozzárendelése
            </label>
            <select
              id="pedagogus_id"
              name="pedagogus_id"
              value={formData.pedagogus_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Válasszon pedagógust (opcionális)</option>
              {pedagogusProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name || profile.email}
                </option>
              ))}
            </select>
          </div>

          {/* Students */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Gyerekek *
              </label>
              <button
                type="button"
                onClick={addStudent}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Gyerek hozzáadása
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {students.map((student, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={student}
                    onChange={(e) => handleStudentChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`${index + 1}. gyerek neve`}
                  />
                  {students.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStudent(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Létrehozás...' : 'Osztály létrehozása'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};