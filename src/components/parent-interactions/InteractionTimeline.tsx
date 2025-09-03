import React from 'react';
import { formatDateTime } from '../../utils/formatters';
import { Edit, Trash2, Star, Calendar, Clock, Users, MessageSquare, CheckCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { ParentInteraction } from '../../types/parent-interactions';

interface InteractionTimelineProps {
  interactions: ParentInteraction[];
  onEdit: (interaction: ParentInteraction) => void;
  onDelete: (id: string) => void;
}

export const InteractionTimeline: React.FC<InteractionTimelineProps> = ({
  interactions,
  onEdit,
  onDelete
}) => {
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || MessageSquare;
  };

  const renderQualityRating = (rating?: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`w-3 h-3 ${
              index < rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatFollowUpDate = (date?: string | null) => {
    if (!date) return null;
    const followUpDate = new Date(date);
    const today = new Date();
    const isOverdue = followUpDate < today;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${
        isOverdue ? 'text-red-600' : 'text-gray-500'
      }`}>
        <Calendar className="w-3 h-3" />
        <span>Követés: {followUpDate.toLocaleDateString('hu-HU')}</span>
        {isOverdue && <span className="text-red-600 font-medium">(Lejárt)</span>}
      </div>
    );
  };

  if (interactions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Még nincsenek kapcsolatok</h3>
          <p className="text-gray-500 text-sm sm:text-base">
            Kezdje az első szülői kapcsolat létrehozásával a jobb oldali űrlap segítségével.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-0">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-300" />
        
        {interactions.map((interaction) => {
          const Icon = getIcon(interaction.interaction_types?.icon || 'MessageSquare');
          const tierColor = interaction.interaction_types?.color || '#3B82F6';
          
          return (
            <div key={interaction.id} className="relative flex gap-3 sm:gap-4 pb-6 sm:pb-8">
              {/* Timeline dot with icon */}
              <div
                className="relative z-10 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-md flex-shrink-0"
                style={{ backgroundColor: tierColor }}
              >
                <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              
              {/* Content card */}
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 break-words text-sm sm:text-base">
                      {interaction.title}
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(interaction.interaction_date)}</span>
                      </div>
                      {interaction.duration_minutes && (
                        <span>{interaction.duration_minutes} perc</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: `${tierColor}20`,
                        color: tierColor,
                        border: `1px solid ${tierColor}40`
                      }}
                    >
                      {interaction.hour_value}ó
                    </span>
                    {renderQualityRating(interaction.quality_rating)}
                  </div>
                </div>

                <p className="text-gray-600 text-xs sm:text-sm mb-3 leading-relaxed break-words">
                  {interaction.description}
                </p>

                {/* Participants */}
                {interaction.participants && interaction.participants.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 hidden sm:inline">Résztvevők:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {interaction.participants.map((participant: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs break-words">
                          {participant}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Topics */}
                {interaction.key_topics && interaction.key_topics.length > 0 && (
                  <div className="mb-2">
                    <h5 className="text-xs font-medium text-gray-500 mb-1 sm:hidden">Kulcstémák:</h5>
                    <div className="flex flex-wrap gap-1">
                      {interaction.key_topics.map((topic: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 break-words">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {interaction.action_items && interaction.action_items.length > 0 && (
                  <div className="mb-2">
                    <h5 className="text-xs font-medium text-gray-500 mb-1">Feladatok:</h5>
                    <ul className="space-y-1">
                      {interaction.action_items.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cultural Notes */}
                {interaction.cultural_notes && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded text-xs">
                    <span className="font-medium text-gray-600">Kulturális megjegyzések: </span>
                    <span className="text-gray-600 break-words">{interaction.cultural_notes}</span>
                  </div>
                )}

                {/* Follow-up date */}
                {interaction.follow_up_date && (
                  <div className="mb-3">
                    {formatFollowUpDate(interaction.follow_up_date)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(interaction)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Szerkesztés
                    </button>
                    <button
                      onClick={() => onDelete(interaction.id)}
                      className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Törlés
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 break-words sm:ml-auto">
                    {interaction.interaction_types?.name}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};