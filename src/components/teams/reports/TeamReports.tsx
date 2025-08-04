import React, { useState } from 'react';
import { Calendar, Filter, FileText, TrendingUp } from 'lucide-react';
import { TeamAnalytics } from '../analytics/TeamAnalytics';

export const TeamReports: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [activeReportType, setActiveReportType] = useState('analytics');

  const timeRangeOptions = [
    { value: '7d', label: '7 nap' },
    { value: '30d', label: '30 nap' },
    { value: '90d', label: '90 nap' }
  ];

  const reportTypes = [
    { 
      id: 'analytics', 
      label: 'Analitika', 
      icon: TrendingUp, 
      description: 'Teljesítmény trendek és metrikák' 
    },
    { 
      id: 'performance', 
      label: 'Teljesítmény', 
      icon: FileText, 
      description: 'Csapat és egyéni teljesítmény jelentések' 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Csapat Jelentések</h1>
            <p className="text-gray-600">Részletes analitika és teljesítmény jelentések</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Report Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={activeReportType}
                onChange={(e) => setActiveReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {reportTypes.map(type => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                onClick={() => setActiveReportType(type.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  activeReportType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activeReportType === type.id ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      activeReportType === type.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${
                      activeReportType === type.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      {activeReportType === 'analytics' && (
        <TeamAnalytics selectedTimeRange={selectedTimeRange} />
      )}

      {activeReportType === 'performance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Teljesítmény Jelentések</h3>
          <p className="text-gray-600 mb-4">
            Ez a funkció jelenleg fejlesztés alatt áll. Hamarosan elérhető lesz!
          </p>
          <div className="text-sm text-gray-500">
            Tervezett funkciók:
            <ul className="mt-2 space-y-1">
              <li>• Részletes egyéni teljesítmény jelentések</li>
              <li>• Csapat összehasonlító analitika</li>
              <li>• Célok és eredmények követése</li>
              <li>• Automatikus jelentés generálás</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};