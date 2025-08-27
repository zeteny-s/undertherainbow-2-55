import React from 'react';
import { GraduationCap, Calendar, MessageCircle, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const PedagogusBlankDashboard: React.FC = () => {
  const { user } = useAuth();

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Pedagógus';
    
    if (hour >= 4 && hour < 10) {
      return `Jó Reggelt, ${userName}!`;
    } else if (hour >= 10 && hour < 18) {
      return `Szia, ${userName}!`;
    } else if (hour >= 18 && hour < 21) {
      return `Jó estét, ${userName}!`;
    } else {
      return `Jó éjszakát, ${userName}!`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTimeBasedGreeting()}</h1>
          <p className="text-gray-600">Üdvözöljük a pedagógus portálon</p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Naptár</h3>
                <p className="text-sm text-gray-600">Események kezelése</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
                <p className="text-sm text-gray-600">Kommunikáció</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Jelenléti</h3>
                <p className="text-sm text-gray-600">Jelenlét kezelése</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Dokumentumok</h3>
                <p className="text-sm text-gray-600">Fájlok kezelése</p>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="p-4 bg-blue-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Üdvözöljük a Pedagógus Portálon!</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Itt érheti el a naptár funkciókat, kommunikálhat kollégáival, 
              kezelheti a dokumentumokat és használhatja a jelenléti rendszert.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-gray-900 mb-1">Naptár</h3>
                <p className="text-sm text-gray-600">Események és találkozók</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-gray-900 mb-1">Chat</h3>
                <p className="text-sm text-gray-600">Azonnali üzenetküldés</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-gray-900 mb-1">Dokumentumok</h3>
                <p className="text-sm text-gray-600">Fájlok tárolása</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-gray-900 mb-1">Jelenléti</h3>
                <p className="text-sm text-gray-600">Jelenlét nyilvántartás</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};