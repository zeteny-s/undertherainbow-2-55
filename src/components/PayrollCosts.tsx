import React from 'react';
import { DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';

export const PayrollCosts: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-green-600" />
          Bérköltségek
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">Személyi jellegű kifizetések és bérköltségek kezelése</p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bérköltségek modul</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Ez a modul a személyi jellegű kifizetések és bérköltségek kezelésére szolgál. 
            A funkciók hamarosan elérhetők lesznek.
          </p>
          
          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-4">
              <DollarSign className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-gray-700 mb-1">Bérek nyilvántartása</h4>
              <p className="text-xs text-gray-500">Alkalmazottak béreinek kezelése</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <TrendingUp className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-gray-700 mb-1">Költséganalízis</h4>
              <p className="text-xs text-gray-500">Bérköltségek elemzése és riportok</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <Calendar className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-gray-700 mb-1">Időszakos jelentések</h4>
              <p className="text-xs text-gray-500">Havi és éves bérköltség összesítők</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};