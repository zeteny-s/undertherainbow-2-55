import React from 'react';
import { TrendingUp, Clock, Target, Calendar, Award } from 'lucide-react';
import { AnnualProgress, YEARLY_GOAL_HOURS } from '../../types/family-relationships';

interface ProgressCardProps {
  progress: AnnualProgress;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ progress }) => {
  const totalHours = progress.total_hours || 0;
  const progressPercentage = Math.min((totalHours / YEARLY_GOAL_HOURS) * 100, 100);
  const remainingHours = Math.max(YEARLY_GOAL_HOURS - totalHours, 0);
  const isFriendshipLevel = progressPercentage >= 100;

  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-blue-500';
    if (progressPercentage >= 50) return 'bg-yellow-500';
    if (progressPercentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = () => {
    if (progressPercentage >= 100) return 'text-green-700';
    if (progressPercentage >= 75) return 'text-blue-700';
    if (progressPercentage >= 50) return 'text-yellow-700';
    if (progressPercentage >= 25) return 'text-orange-700';
    return 'text-red-700';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Nincs adat';
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            Kapcsolatépítési Haladás - {progress.academic_year}
          </h3>
        </div>
        
        {isFriendshipLevel && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <Award className="h-4 w-4" />
            Baráti Szint Elérve!
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {totalHours.toFixed(1)} / {YEARLY_GOAL_HOURS} óra
          </span>
          <span className={`text-sm font-medium ${getProgressTextColor()}`}>
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        
        {progressPercentage > 100 && (
          <p className="text-xs text-green-600 mt-1">
            Túlteljesítés: +{(totalHours - YEARLY_GOAL_HOURS).toFixed(1)} óra
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-4 w-4 text-gray-500 mr-1" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(totalHours * 60)}
          </div>
          <div className="text-xs text-gray-500">
            Összes perc
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="h-4 w-4 text-gray-500 mr-1" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progress.total_interactions || 0}
          </div>
          <div className="text-xs text-gray-500">
            Interakciók
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
          </div>
          <div className="text-sm font-bold text-gray-900">
            {formatDate(progress.last_interaction_date)}
          </div>
          <div className="text-xs text-gray-500">
            Utolsó interakció
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="h-4 w-4 text-gray-500 mr-1" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {remainingHours.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            Hátralevő órák
          </div>
        </div>
      </div>

      {/* Goal Information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Cél:</strong> {YEARLY_GOAL_HOURS} óra évente a családdal való kapcsolattartásra, 
          hogy elérjük a "baráti szintet" és természetes ajánlásokat generáljunk.
        </p>
        
        {!isFriendshipLevel && remainingHours > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            <strong>Átlagosan:</strong> {(remainingHours * 60 / 40).toFixed(0)} perc/hét 
            szükséges a cél eléréséhez.
          </p>
        )}
      </div>
    </div>
  );
};