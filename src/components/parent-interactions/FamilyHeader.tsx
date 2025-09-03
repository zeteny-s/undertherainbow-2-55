import React from 'react';
import { Calendar } from 'lucide-react';
import type { Family, AnnualProgress } from '../../types/parent-interactions';

interface FamilyHeaderProps {
  families: Family[];
  selectedFamily: Family | null;
  onFamilyChange: (family: Family) => void;
  progress: AnnualProgress | null;
  academicYear: string;
  onAcademicYearChange: (year: string) => void;
}

export const FamilyHeader: React.FC<FamilyHeaderProps> = ({
  families,
  selectedFamily,
  onFamilyChange,
  progress,
  academicYear,
  onAcademicYearChange
}) => {
  const currentHours = progress?.total_hours || 0;
  const goalHours = progress?.goal_hours || 15.0;
  const progressPercentage = Math.min((currentHours / goalHours) * 100, 100);
  
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-yellow-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    return 'bg-red-500';
  };

  const getProgressStatus = () => {
    if (currentHours >= goalHours) return 'Completed';
    if (currentHours >= goalHours * 0.75) return 'On Track';
    if (currentHours >= goalHours * 0.5) return 'Needs Attention';
    return 'At Risk';
  };

  // Generate academic year options (current and previous 2 years)
  const currentDate = new Date();
  const currentAcademicYear = currentDate.getMonth() >= 8 ? 
    currentDate.getFullYear() : 
    currentDate.getFullYear() - 1;
  
  const academicYearOptions = [];
  for (let i = 0; i < 3; i++) {
    const year = currentAcademicYear - i;
    academicYearOptions.push(`${year}-${year + 1}`);
  }

  return (
    <div className="bg-white border-b border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <label className="text-sm font-medium text-gray-600 mb-2 block">
              Selected Family
            </label>
            <select
              value={selectedFamily?.id || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const family = families.find(f => f.id === e.target.value);
                if (family) onFamilyChange(family);
              }}
              className="w-64 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a family</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name} {family.primary_contact_name && `- ${family.primary_contact_name}`}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="text-sm font-medium text-gray-600 mb-2 block">
              Academic Year
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={academicYear}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onAcademicYearChange(e.target.value)}
                className="w-32 pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedFamily && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedFamily.name}
              </h3>
              {selectedFamily.primary_contact_name && (
                <p className="text-sm text-gray-600">
                  Primary Contact: {selectedFamily.primary_contact_name}
                </p>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentHours.toFixed(1)} / {goalHours} hrs
              </div>
              <div className={`text-sm font-medium ${
                progressPercentage >= 100 ? 'text-green-600' :
                progressPercentage >= 75 ? 'text-yellow-600' :
                progressPercentage >= 50 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {getProgressStatus()}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progress?.total_interactions || 0} interactions</span>
            <span>{progressPercentage.toFixed(0)}% complete</span>
          </div>
        </div>
      )}
    </div>
  );
};