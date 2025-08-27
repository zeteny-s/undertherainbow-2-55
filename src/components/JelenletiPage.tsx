import React from 'react';
import { Users, Plus, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const JelenletiPage: React.FC = () => {
  const { user } = useAuth();

  const isAdminisztracio = user?.user_metadata?.profile_type === 'adminisztracio';

  if (!isAdminisztracio) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Jelenléti</h1>
            <p className="text-gray-600">Ez a funkció jelenleg fejlesztés alatt áll.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jelenléti</h1>
          <p className="text-gray-600">Pedagógusok és osztályok kezelése</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Osztályok
                </h2>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Új osztály
                </button>
              </div>

              {true ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Még nincsenek osztályok</h3>
                  <p className="text-gray-600 mb-4">Kezdje el az első osztály létrehozásával</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Osztály létrehozása
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Classes will be rendered here */}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Beállítások</h3>
              <div className="space-y-3">
                <button className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings className="h-4 w-4 mr-3" />
                  Általános beállítások
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};