import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminAttendanceView } from './attendance/AdminAttendanceView';
import { PedagogusAttendanceView } from './attendance/PedagogusAttendanceView';

export const JelenletiPage: React.FC = () => {
  const { user } = useAuth();

  const isAdminisztracio = user?.user_metadata?.profile_type === 'adminisztracio';
  const isPedagogus = user?.user_metadata?.profile_type === 'pedagogus';

  if (isAdminisztracio) {
    return <AdminAttendanceView />;
  }

  if (isPedagogus) {
    return <PedagogusAttendanceView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Jelenléti</h1>
          <p className="text-gray-600">Ez a funkció csak adminisztráció és pedagógus profilokhoz érhető el.</p>
        </div>
      </div>
    </div>
  );
};